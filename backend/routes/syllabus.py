from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db

syllabus_bp = Blueprint('syllabus', __name__)


@syllabus_bp.route('/', methods=['GET'])
@jwt_required()
def get_syllabus():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM syllabus WHERE user_id = ? ORDER BY subject, id', (user_id,)
        ).fetchall()
        topics = [dict(r) for r in rows]

        # Group by subject with progress
        subjects = {}
        for t in topics:
            subj = t['subject']
            if subj not in subjects:
                subjects[subj] = {'subject': subj, 'topics': [], 'total': 0, 'completed': 0}
            subjects[subj]['topics'].append(t)
            subjects[subj]['total'] += 1
            if t['status'] == 1:
                subjects[subj]['completed'] += 1

        for s in subjects.values():
            s['progress'] = round((s['completed'] / s['total']) * 100, 1) if s['total'] > 0 else 0

        return jsonify({'syllabus': list(subjects.values()), 'all_topics': topics}), 200
    finally:
        db.close()


@syllabus_bp.route('/', methods=['POST'])
@jwt_required()
def add_topic():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    subject = data.get('subject', '').strip()
    topic = data.get('topic', '').strip()
    if not subject or not topic:
        return jsonify({'error': 'Subject and topic required'}), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO syllabus (user_id, subject, topic) VALUES (?, ?, ?)',
            (user_id, subject, topic)
        )
        db.commit()
        return jsonify({'message': 'Topic added', 'id': cursor.lastrowid}), 201
    finally:
        db.close()


@syllabus_bp.route('/bulk', methods=['POST'])
@jwt_required()
def add_bulk_topics():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    subject = data.get('subject', '').strip()
    topics = data.get('topics', [])
    if not subject or not topics:
        return jsonify({'error': 'Subject and topics required'}), 400

    db = get_db()
    try:
        added = 0
        for t in topics:
            t = t.strip()
            if t:
                db.execute('INSERT INTO syllabus (user_id, subject, topic) VALUES (?, ?, ?)', (user_id, subject, t))
                added += 1
        db.commit()
        return jsonify({'message': f'{added} topics added'}), 201
    finally:
        db.close()


@syllabus_bp.route('/<int:topic_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_topic(topic_id):
    user_id = get_jwt_identity()
    db = get_db()
    try:
        existing = db.execute(
            'SELECT status FROM syllabus WHERE id = ? AND user_id = ?', (topic_id, user_id)
        ).fetchone()
        if not existing:
            return jsonify({'error': 'Not found'}), 404
        new_status = 0 if existing['status'] == 1 else 1
        db.execute('UPDATE syllabus SET status = ? WHERE id = ? AND user_id = ?', (new_status, topic_id, user_id))
        db.commit()
        return jsonify({'message': 'Toggled', 'status': new_status}), 200
    finally:
        db.close()


@syllabus_bp.route('/<int:topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    user_id = get_jwt_identity()
    db = get_db()
    try:
        result = db.execute('DELETE FROM syllabus WHERE id = ? AND user_id = ?', (topic_id, user_id))
        db.commit()
        if result.rowcount == 0:
            return jsonify({'error': 'Not found'}), 404
        return jsonify({'message': 'Deleted'}), 200
    finally:
        db.close()


@syllabus_bp.route('/subject/<subject>', methods=['DELETE'])
@jwt_required()
def delete_subject(subject):
    user_id = get_jwt_identity()
    db = get_db()
    try:
        db.execute('DELETE FROM syllabus WHERE user_id = ? AND subject = ?', (user_id, subject))
        db.commit()
        return jsonify({'message': 'Subject deleted'}), 200
    finally:
        db.close()


@syllabus_bp.route('/extract', methods=['POST'])
@jwt_required()
def extract_syllabus():
    subject = request.form.get('subject', 'Extracted Subject')
    extracted_text = ""
    user_id = get_jwt_identity()
    
    if 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        import os
        import fitz
        from werkzeug.utils import secure_filename
        from config import Config

        filename = secure_filename(file.filename)
        upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(user_id), 'syllabus')
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        try:
            if filename.lower().endswith('.pdf'):
                doc = fitz.open(filepath)
                for page in doc:
                    extracted_text += page.get_text() + "\n"
                doc.close()
            elif filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                import easyocr
                reader = easyocr.Reader(['en'], verbose=False)
                result = reader.readtext(filepath)
                extracted_text = "\n".join([text for (_, text, _) in result])
            else:
                return jsonify({'error': 'Unsupported file format'}), 400
        except Exception as e:
            return jsonify({'error': f'Failed to process file: {str(e)}'}), 500
    elif 'raw_text' in request.form and request.form['raw_text'].strip() != '':
        extracted_text = request.form['raw_text']
    else:
        return jsonify({'error': 'No file or raw text provided'}), 400

    # Robust Heuristic to find Unit/Chapter headers and topics
    lines = [line.strip() for line in extracted_text.split('\n') if line.strip() and len(line.strip()) > 2]
    
    topics_to_add = []
    import re
    
    for i, line in enumerate(lines):
        lower_line = line.lower()
        
        # 1. Check if line starts with UNIT or MODULE
        if re.search(r'^(unit|module)[\s\-]*[ivx0-9]+', lower_line):
            # If the unit name is on the same line (e.g. "UNIT-I Data Management")
            parts = re.split(r'^(unit|module)[\s\-]*[ivx0-9]+[\s\:\-\.]*', lower_line, flags=re.IGNORECASE)
            if len(parts) > 2 and len(parts[2].strip()) > 3:
                 topic = line[len(line) - len(parts[2]):].split(':')[0].strip()
                 topics_to_add.append(topic)
            # If the unit name is on the next line
            elif i + 1 < len(lines):
                 topic = lines[i+1].split(':')[0].strip()
                 topics_to_add.append(topic)
                 
        # 2. Look for patterns like "Topic Name:"
        elif ":" in line:
            topic_name = line.split(":")[0].strip()
            if len(topic_name.split()) <= 5: # likely a topic header
                ignore_list = ["prerequisites", "course objectives", "course outcomes", "textbooks", "referencebooks", "reference books", "references"]
                if topic_name.lower() not in ignore_list and topic_name.lower() not in [t.lower() for t in topics_to_add]:
                    topics_to_add.append(topic_name)

    # Deduplicate and clean
    unique_topics = []
    for t in topics_to_add:
        # Split by comma or semicolon to get individual topics instead of one long string
        for sub_t in re.split(r'[,;]', t):
            clean_t = re.sub(r'^[\d\.\-\*\s]+', '', sub_t).strip()
            # Remove trailing periods
            if clean_t.endswith('.'):
                clean_t = clean_t[:-1].strip()
                
            if len(clean_t) > 3 and clean_t not in unique_topics:
                unique_topics.append(clean_t)
            
    if not unique_topics:
        # Fallback if nothing is found (only if raw_text was provided to avoid garbage)
        if 'raw_text' in request.form:
             for line in lines[:10]:
                 if "syllabus" not in line.lower() and "course" not in line.lower():
                     unique_topics.append(line)
        else:
             return jsonify({'error': 'Could not reliably read topics from the image. Please use the Paste Text option instead.'}), 400
                 
    topics_to_add = unique_topics[:40]

    db = get_db()
    try:
        added = 0
        for t in topics_to_add:
            db.execute('INSERT INTO syllabus (user_id, subject, topic) VALUES (?, ?, ?)', (user_id, subject, t))
            added += 1
        db.commit()
        return jsonify({'message': f'Extracted {added} topics', 'topics': topics_to_add, 'subject': subject}), 200
    finally:
        db.close()


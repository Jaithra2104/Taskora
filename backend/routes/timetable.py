from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
import csv
import io
import re
from io import BytesIO
from PIL import Image
import traceback

timetable_bp = Blueprint('timetable', __name__)

VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

# Global variable to cache OCR reader
ocr_reader = None

def get_ocr_reader():
    """Get or initialize OCR reader lazily."""
    global ocr_reader
    if ocr_reader is None:
        try:
            import easyocr
            print("[OCR] Initializing EasyOCR reader...")
            ocr_reader = easyocr.Reader(['en'], gpu=False)
            print("[OCR] EasyOCR reader initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize OCR: {e}")
            raise
    return ocr_reader


def extract_timetable_from_ocr(text):
    """
    Parse timetable information from OCR extracted text.
    Looks for patterns like:
    Monday 09:00-10:30 Mathematics Dr. Smith Room 201
    """
    lines = text.split('\n')
    entries = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Try to extract day, time, subject, teacher, room
        # Pattern: Day HH:MM-HH:MM Subject Teacher Room###
        day_pattern = '|'.join(VALID_DAYS)
        time_pattern = r'(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})'
        room_pattern = r'[Rr]oom\s*(\d+[a-zA-Z]*)'
        
        day_match = re.search(f'({day_pattern})', line, re.IGNORECASE)
        time_match = re.search(time_pattern, line)
        room_match = re.search(room_pattern, line)
        
        if day_match and time_match:
            day = day_match.group(1).capitalize()
            start_hour, start_min, end_hour, end_min = time_match.groups()
            start_time = f"{int(start_hour):02d}:{start_min}"
            end_time = f"{int(end_hour):02d}:{end_min}"
            
            # Extract subject (between time and teacher/room or end of line)
            time_end = time_match.end()
            room_start = room_match.start() if room_match else len(line)
            middle_text = line[time_end:room_start].strip()
            
            # Try to split into subject and teacher
            parts = middle_text.split()
            subject = ' '.join(parts[:max(1, len(parts)//2)])
            teacher = ' '.join(parts[max(1, len(parts)//2):]) if len(parts) > 1 else ''
            room = room_match.group(1) if room_match else ''
            
            entries.append({
                'day': day,
                'subject': subject,
                'start_time': start_time,
                'end_time': end_time,
                'teacher': teacher,
                'room': room
            })
    
    return entries


@timetable_bp.route('/upload-image', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload timetable from image and extract using OCR."""
    user_id = get_jwt_identity()

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
            return jsonify({'error': 'Only image files are accepted (JPG, PNG, GIF, BMP)'}), 400

        print(f"[DEBUG] Processing image: {file.filename}")

        # Read and process image
        image_data = file.read()
        image = Image.open(BytesIO(image_data))
        image = image.convert('RGB')
        
        print("[DEBUG] Image loaded successfully")
        print("[DEBUG] Initializing OCR reader...")
        
        # Extract text using easyocr
        try:
            reader = get_ocr_reader()
            print("[DEBUG] Running OCR on image...")
            result = reader.readtext(image, detail=0)
            extracted_text = '\n'.join(result)
            print(f"[DEBUG] OCR extraction complete. Found {len(result)} text segments")
            print(f"[DEBUG] Extracted text preview: {extracted_text[:200]}")
        except Exception as e:
            error_msg = f'OCR processing failed: {str(e)}'
            print(f"[ERROR] {error_msg}")
            print(traceback.format_exc())
            return jsonify({'error': error_msg}), 500
        
        # Parse timetable entries
        print("[DEBUG] Parsing timetable entries...")
        entries = extract_timetable_from_ocr(extracted_text)
        print(f"[DEBUG] Parsed {len(entries)} entries")
        
        if not entries:
            return jsonify({
                'error': 'No timetable entries found. Image may not contain a valid timetable. Try a clearer image.',
                'extracted_text': extracted_text[:300] if extracted_text else 'No text extracted'
            }), 400
        
        # Store in database
        db = get_db()
        try:
            added = 0
            errors = []
            
            for entry in entries:
                if entry['day'] not in VALID_DAYS:
                    errors.append(f"Invalid day: {entry['day']}")
                    continue
                
                try:
                    db.execute(
                        'INSERT INTO timetable (user_id, day, subject, start_time, end_time, room, teacher) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        (user_id, entry['day'], entry['subject'], entry['start_time'], entry['end_time'], entry['room'], entry['teacher'])
                    )
                    added += 1
                except Exception as e:
                    errors.append(f"{entry['day']} {entry['subject']}: {str(e)}")
            
            db.commit()
            print(f"[OK] Added {added} entries, {len(errors)} errors")
            
            return jsonify({
                'message': f'Successfully added {added} timetable entries from image',
                'added': added,
                'errors': errors,
                'entries': entries
            }), 201
            
        finally:
            db.close()
        
    except Exception as e:
        error_msg = f'Failed to process image: {str(e)}'
        print(f"[ERROR] {error_msg}")
        print(traceback.format_exc())
        return jsonify({'error': error_msg}), 400


@timetable_bp.route('/', methods=['GET'])
@jwt_required()
def get_timetable():
    """Get user's full timetable."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM timetable WHERE user_id = ? ORDER BY CASE day '
            "WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 "
            "WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 "
            "WHEN 'Sunday' THEN 7 END, start_time",
            (user_id,)
        ).fetchall()

        timetable = [dict(row) for row in rows]
        return jsonify({'timetable': timetable}), 200
    finally:
        db.close()


@timetable_bp.route('/', methods=['POST'])
@jwt_required()
def add_entry():
    """Add a single timetable entry."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    day = data.get('day', '').strip()
    subject = data.get('subject', '').strip()
    start_time = data.get('start_time', '').strip()
    end_time = data.get('end_time', '').strip()
    room = data.get('room', '').strip()

    if not day or not subject or not start_time or not end_time:
        return jsonify({'error': 'Day, subject, start_time, and end_time are required'}), 400

    if day not in VALID_DAYS:
        return jsonify({'error': f'Invalid day. Must be one of: {", ".join(VALID_DAYS)}'}), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO timetable (user_id, day, subject, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)',
            (user_id, day, subject, start_time, end_time, room)
        )
        db.commit()

        return jsonify({
            'message': 'Timetable entry added',
            'id': cursor.lastrowid
        }), 201
    finally:
        db.close()


@timetable_bp.route('/upload-csv', methods=['POST'])
@jwt_required()
def upload_csv():
    """Upload timetable from CSV file."""
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Only CSV files are accepted'}), 400

    db = get_db()
    try:
        content = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))

        added = 0
        errors = []

        for i, row in enumerate(reader, start=2):
            day = row.get('day', row.get('Day', '')).strip()
            subject = row.get('subject', row.get('Subject', '')).strip()
            start_time = row.get('start_time', row.get('Start Time', '')).strip()
            end_time = row.get('end_time', row.get('End Time', '')).strip()
            room = row.get('room', row.get('Room', '')).strip()

            if not day or not subject or not start_time or not end_time:
                errors.append(f'Row {i}: Missing required fields')
                continue

            if day not in VALID_DAYS:
                errors.append(f'Row {i}: Invalid day "{day}"')
                continue

            db.execute(
                'INSERT INTO timetable (user_id, day, subject, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)',
                (user_id, day, subject, start_time, end_time, room)
            )
            added += 1

        db.commit()

        return jsonify({
            'message': f'Successfully added {added} entries',
            'added': added,
            'errors': errors
        }), 201
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400
    finally:
        db.close()


@timetable_bp.route('/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    """Update a timetable entry."""
    user_id = get_jwt_identity()
    data = request.get_json()

    db = get_db()
    try:
        existing = db.execute(
            'SELECT * FROM timetable WHERE id = ? AND user_id = ?',
            (entry_id, user_id)
        ).fetchone()

        if not existing:
            return jsonify({'error': 'Entry not found'}), 404

        day = data.get('day', existing['day'])
        subject = data.get('subject', existing['subject'])
        start_time = data.get('start_time', existing['start_time'])
        end_time = data.get('end_time', existing['end_time'])
        room = data.get('room', existing['room'])

        db.execute(
            'UPDATE timetable SET day=?, subject=?, start_time=?, end_time=?, room=? WHERE id=? AND user_id=?',
            (day, subject, start_time, end_time, room, entry_id, user_id)
        )
        db.commit()

        return jsonify({'message': 'Entry updated'}), 200
    finally:
        db.close()


@timetable_bp.route('/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    """Delete a timetable entry."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        result = db.execute(
            'DELETE FROM timetable WHERE id = ? AND user_id = ?',
            (entry_id, user_id)
        )
        db.commit()

        if result.rowcount == 0:
            return jsonify({'error': 'Entry not found'}), 404

        return jsonify({'message': 'Entry deleted'}), 200
    finally:
        db.close()


@timetable_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today():
    """Get today's schedule."""
    user_id = get_jwt_identity()
    from datetime import datetime
    today = datetime.now().strftime('%A')

    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM timetable WHERE user_id = ? AND day = ? ORDER BY start_time',
            (user_id, today)
        ).fetchall()

        schedule = [dict(row) for row in rows]
        return jsonify({'day': today, 'schedule': schedule}), 200
    finally:
        db.close()

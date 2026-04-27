import os
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import get_db
from config import Config

certificates_bp = Blueprint('certificates', __name__)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


@certificates_bp.route('/', methods=['GET'])
@jwt_required()
def get_certificates():
    user_id = get_jwt_identity()
    category = request.args.get('category', None)
    search = request.args.get('search', None)
    db = get_db()
    try:
        query = 'SELECT * FROM certificates WHERE user_id = ?'
        params = [user_id]
        if category:
            query += ' AND category = ?'
            params.append(category)
        if search:
            query += ' AND (title LIKE ? OR description LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%'])
        query += ' ORDER BY created_at DESC'
        rows = db.execute(query, params).fetchall()
        return jsonify({'certificates': [dict(r) for r in rows]}), 200
    finally:
        db.close()


@certificates_bp.route('/', methods=['POST'])
@jwt_required()
def upload_certificate():
    user_id = get_jwt_identity()
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded. Make sure to select a file.'}), 400
        file = request.files['file']
        title = request.form.get('title', '').strip()
        category = request.form.get('category', 'general').strip()
        issued_date = request.form.get('issued_date', '').strip()
        description = request.form.get('description', '').strip()

        if not title:
            return jsonify({'error': 'Title is required'}), 400
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[-1] if '.' in file.filename else 'unknown'
            return jsonify({'error': f'File type .{ext} is not allowed. Use PDF, PNG, JPG, JPEG, GIF or WEBP.'}), 400

        user_dir = os.path.join(Config.UPLOAD_FOLDER, str(user_id), 'certificates')
        os.makedirs(user_dir, exist_ok=True)

        original_name = file.filename
        safe_name = secure_filename(original_name)
        # Fall back if secure_filename strips everything
        if not safe_name or safe_name == '':
            import time
            safe_name = f"cert_{int(time.time())}.pdf"

        import time
        unique = f"{int(time.time())}_{safe_name}"
        save_path = os.path.join(user_dir, unique)
        file.save(save_path)

        # Verify file was saved
        if not os.path.exists(save_path):
            return jsonify({'error': 'File could not be saved on server'}), 500

        file_url = f"/uploads/{user_id}/certificates/{unique}"

        db = get_db()
        try:
            cursor = db.execute(
                'INSERT INTO certificates (user_id, title, category, file_url, file_name, issued_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (user_id, title, category, file_url, original_name, issued_date, description)
            )
            db.commit()
            return jsonify({'message': 'Certificate uploaded successfully', 'id': cursor.lastrowid, 'file_url': file_url}), 201
        finally:
            db.close()
    except Exception as ex:
        return jsonify({'error': f'Upload failed: {str(ex)}'}), 500


@certificates_bp.route('/<int:cert_id>', methods=['DELETE'])
@jwt_required()
def delete_certificate(cert_id):
    user_id = get_jwt_identity()
    db = get_db()
    try:
        cert = db.execute('SELECT * FROM certificates WHERE id = ? AND user_id = ?', (cert_id, user_id)).fetchone()
        if not cert:
            return jsonify({'error': 'Not found'}), 404
        fp = os.path.join(Config.UPLOAD_FOLDER, str(user_id), 'certificates', os.path.basename(cert['file_url']))
        if os.path.exists(fp):
            os.remove(fp)
        db.execute('DELETE FROM certificates WHERE id = ? AND user_id = ?', (cert_id, user_id))
        db.commit()
        return jsonify({'message': 'Deleted'}), 200
    finally:
        db.close()

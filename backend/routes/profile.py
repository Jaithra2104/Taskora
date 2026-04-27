import os
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import get_db
from config import Config

profile_bp = Blueprint('profile', __name__)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'webp'}

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    db = get_db()
    try:
        user = db.execute("SELECT id, name, email, first_name, last_name, mobile_no, linkedin, github, profile_pic, bio FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(dict(user)), 200
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@profile_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_profile_pic():
    user_id = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        user_dir = os.path.join(Config.UPLOAD_FOLDER, str(user_id), 'profile')
        os.makedirs(user_dir, exist_ok=True)
        filename = secure_filename(file.filename)
        import time
        unique_filename = f"avatar_{int(time.time())}_{filename}"
        save_path = os.path.join(user_dir, unique_filename)
        file.save(save_path)
        
        file_url = f"/uploads/{user_id}/profile/{unique_filename}"
        return jsonify({'file_url': file_url}), 200
    return jsonify({'error': 'File type not allowed'}), 400

@profile_bp.route('/', methods=['POST'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    db = get_db()
    try:
        # Update user name as well if first/last name changed
        name = data.get('name')
        if not name:
            fn = data.get('first_name', '') or ''
            ln = data.get('last_name', '') or ''
            name = f"{fn} {ln}".strip()
        if not name:
            name = "User"

        db.execute(
            "UPDATE users SET name = ?, first_name = ?, last_name = ?, mobile_no = ?, linkedin = ?, github = ?, profile_pic = ?, bio = ? WHERE id = ?",
            (
                name,
                data.get('first_name'),
                data.get('last_name'),
                data.get('mobile_no'),
                data.get('linkedin'),
                data.get('github'),
                data.get('profile_pic'),
                data.get('bio'),
                user_id
            )
        )
        db.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

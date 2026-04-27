from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
import logging

profile_bp = Blueprint('profile', __name__)
logger = logging.getLogger(__name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
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

@profile_bp.route('/', methods=['POST'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    db = get_db()
    try:
        # Update user name as well if first/last name changed
        name = data.get('name')
        if not name:
            name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()

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

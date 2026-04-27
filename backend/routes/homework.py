from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db

homework_bp = Blueprint('homework', __name__)


@homework_bp.route('/', methods=['GET'])
@jwt_required()
def get_homework():
    """Get all homework for user."""
    user_id = get_jwt_identity()
    status_filter = request.args.get('status', None)

    db = get_db()
    try:
        if status_filter:
            rows = db.execute(
                'SELECT * FROM homework WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
                (user_id, status_filter)
            ).fetchall()
        else:
            rows = db.execute(
                'SELECT * FROM homework WHERE user_id = ? ORDER BY created_at DESC',
                (user_id,)
            ).fetchall()

        homework = [dict(row) for row in rows]
        return jsonify({'homework': homework}), 200
    finally:
        db.close()


@homework_bp.route('/', methods=['POST'])
@jwt_required()
def add_homework():
    """Add new homework."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    due_date = data.get('due_date', None)

    if not subject or not description:
        return jsonify({'error': 'Subject and description are required'}), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO homework (user_id, subject, description, due_date) VALUES (?, ?, ?, ?)',
            (user_id, subject, description, due_date)
        )
        db.commit()

        return jsonify({
            'message': 'Homework added',
            'id': cursor.lastrowid
        }), 201
    finally:
        db.close()


@homework_bp.route('/<int:hw_id>', methods=['PUT'])
@jwt_required()
def update_homework(hw_id):
    """Update homework (including status toggle)."""
    user_id = get_jwt_identity()
    data = request.get_json()

    db = get_db()
    try:
        existing = db.execute(
            'SELECT * FROM homework WHERE id = ? AND user_id = ?',
            (hw_id, user_id)
        ).fetchone()

        if not existing:
            return jsonify({'error': 'Homework not found'}), 404

        subject = data.get('subject', existing['subject'])
        description = data.get('description', existing['description'])
        status = data.get('status', existing['status'])
        due_date = data.get('due_date', existing['due_date'])

        db.execute(
            'UPDATE homework SET subject=?, description=?, status=?, due_date=? WHERE id=? AND user_id=?',
            (subject, description, status, due_date, hw_id, user_id)
        )
        db.commit()

        return jsonify({'message': 'Homework updated'}), 200
    finally:
        db.close()


@homework_bp.route('/<int:hw_id>', methods=['DELETE'])
@jwt_required()
def delete_homework(hw_id):
    """Delete homework."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        result = db.execute(
            'DELETE FROM homework WHERE id = ? AND user_id = ?',
            (hw_id, user_id)
        )
        db.commit()

        if result.rowcount == 0:
            return jsonify({'error': 'Homework not found'}), 404

        return jsonify({'message': 'Homework deleted'}), 200
    finally:
        db.close()


@homework_bp.route('/<int:hw_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_status(hw_id):
    """Toggle homework status between pending and completed."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        existing = db.execute(
            'SELECT status FROM homework WHERE id = ? AND user_id = ?',
            (hw_id, user_id)
        ).fetchone()

        if not existing:
            return jsonify({'error': 'Homework not found'}), 404

        new_status = 'completed' if existing['status'] == 'pending' else 'pending'
        db.execute(
            'UPDATE homework SET status = ? WHERE id = ? AND user_id = ?',
            (new_status, hw_id, user_id)
        )
        db.commit()

        return jsonify({'message': f'Status changed to {new_status}', 'status': new_status}), 200
    finally:
        db.close()

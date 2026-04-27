from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db

assignments_bp = Blueprint('assignments', __name__)


@assignments_bp.route('/', methods=['GET'])
@jwt_required()
def get_assignments():
    """Get all assignments for user."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        rows = db.execute(
            'SELECT * FROM assignments WHERE user_id = ? ORDER BY due_date ASC',
            (user_id,)
        ).fetchall()

        assignments = [dict(row) for row in rows]
        return jsonify({'assignments': assignments}), 200
    finally:
        db.close()


@assignments_bp.route('/', methods=['POST'])
@jwt_required()
def add_assignment():
    """Add new assignment."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    title = data.get('title', '').strip()
    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    due_date = data.get('due_date', '').strip()
    priority = data.get('priority', 'medium').strip()

    if not title or not subject or not due_date:
        return jsonify({'error': 'Title, subject, and due_date are required'}), 400

    if priority not in ['low', 'medium', 'high']:
        return jsonify({'error': 'Priority must be low, medium, or high'}), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO assignments (user_id, title, subject, description, due_date, priority) '
            'VALUES (?, ?, ?, ?, ?, ?)',
            (user_id, title, subject, description, due_date, priority)
        )
        db.commit()

        return jsonify({
            'message': 'Assignment added',
            'id': cursor.lastrowid
        }), 201
    finally:
        db.close()


@assignments_bp.route('/<int:asg_id>', methods=['PUT'])
@jwt_required()
def update_assignment(asg_id):
    """Update an assignment."""
    user_id = get_jwt_identity()
    data = request.get_json()

    db = get_db()
    try:
        existing = db.execute(
            'SELECT * FROM assignments WHERE id = ? AND user_id = ?',
            (asg_id, user_id)
        ).fetchone()

        if not existing:
            return jsonify({'error': 'Assignment not found'}), 404

        title = data.get('title', existing['title'])
        subject = data.get('subject', existing['subject'])
        description = data.get('description', existing['description'])
        due_date = data.get('due_date', existing['due_date'])
        priority = data.get('priority', existing['priority'])
        status = data.get('status', existing['status'])

        db.execute(
            'UPDATE assignments SET title=?, subject=?, description=?, due_date=?, priority=?, status=? '
            'WHERE id=? AND user_id=?',
            (title, subject, description, due_date, priority, status, asg_id, user_id)
        )
        db.commit()

        return jsonify({'message': 'Assignment updated'}), 200
    finally:
        db.close()


@assignments_bp.route('/<int:asg_id>', methods=['DELETE'])
@jwt_required()
def delete_assignment(asg_id):
    """Delete an assignment."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        result = db.execute(
            'DELETE FROM assignments WHERE id = ? AND user_id = ?',
            (asg_id, user_id)
        )
        db.commit()

        if result.rowcount == 0:
            return jsonify({'error': 'Assignment not found'}), 404

        return jsonify({'message': 'Assignment deleted'}), 200
    finally:
        db.close()


@assignments_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming():
    """Get assignments due within the next 7 days."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM assignments WHERE user_id = ? AND status = 'pending' "
            "AND due_date >= date('now') AND due_date <= date('now', '+7 days') "
            "ORDER BY due_date ASC",
            (user_id,)
        ).fetchall()

        assignments = [dict(row) for row in rows]
        return jsonify({'assignments': assignments}), 200
    finally:
        db.close()

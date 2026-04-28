from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import get_db
import random
import smtplib
from email.mime.text import MIMEText

auth_bp = Blueprint('auth', __name__)

otp_store = {}

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    """Send an OTP for email verification."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    db = get_db()
    try:
        existing = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            return jsonify({'error': 'Email already registered'}), 409
    finally:
        db.close()

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    import os
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')

    if email_user and email_pass:
        try:
            msg = MIMEText(f"Welcome to Taskora!\n\nYour verification code is: {otp}\n\nPlease enter this code on the signup page to complete your account creation.")
            msg['Subject'] = 'Taskora - Email Verification'
            msg['From'] = email_user
            msg['To'] = email

            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)
            server.quit()
            
            return jsonify({'message': 'OTP sent successfully to your email!'}), 200
        except Exception as e:
            print(f"SMTP Error: {str(e)}")
            return jsonify({'error': f'Failed to send email: {str(e)}'}), 500
    else:
        # Fallback for demo purposes
        print(f"\n{'='*40}")
        print(f"🔐 MOCK EMAIL SENT (No SMTP Configured)")
        print(f"To: {email}")
        print(f"OTP CODE: {otp}")
        print(f"{'='*40}\n")

        return jsonify({
            'message': 'Demo mode active (No SMTP credentials set in backend environment).',
            'otp_for_demo': otp
        }), 200

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    otp = data.get('otp', '').strip()

    if not name or not email or not password or not otp:
        return jsonify({'error': 'Name, email, password, and OTP are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Verify OTP
    stored_otp = otp_store.get(email)
    if not stored_otp or stored_otp != otp:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    db = get_db()
    try:
        existing = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            return jsonify({'error': 'Email already registered'}), 409

        hashed_password = generate_password_hash(password)
        cursor = db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            (name, email, hashed_password)
        )
        db.commit()

        user_id = cursor.lastrowid
        access_token = create_access_token(identity=str(user_id))

        # Clear OTP after successful registration
        if email in otp_store:
            del otp_store[email]

        return jsonify({
            'message': 'Account created successfully',
            'token': access_token,
            'user': {'id': user_id, 'name': name, 'email': email}
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    try:
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password'}), 401

        access_token = create_access_token(identity=str(user['id']))

        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        user = db.execute('SELECT id, name, email, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'created_at': user['created_at']
            }
        }), 200
    finally:
        db.close()

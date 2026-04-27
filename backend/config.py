import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'smart-student-companion-secret-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-super-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    DATABASE_PATH = os.path.join(BASE_DIR, 'student_companion.db')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'}
    GEMINI_API_KEY = 'AIzaSyDMyFlmewxsPmVXrGNRc1dq1SYt_odEYMU' # Add your Google AI Studio API Key here to enable video summarization
    DATABASE_URL = os.environ.get('DATABASE_URL') # Set this to your Supabase Connection String for production
    DATABASE_PATH = os.path.join(BASE_DIR, 'student_companion.db')

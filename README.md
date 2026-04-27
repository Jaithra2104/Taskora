# Smart Student Companion 📘

A smart productivity platform for students — manage timetables, homework, assignments, certificates, syllabus progress, and get AI-powered study assistance.

## Features

- 🔐 **User Authentication** — Secure signup/login with JWT
- 📅 **Timetable Management** — Weekly grid, manual + CSV upload
- 📝 **Homework Tracker** — Add, toggle status, filter
- 📋 **Assignment Deadlines** — Countdown timers, priority levels
- 🏆 **Certificate Storage** — Upload PDFs/images, search & filter
- 📚 **Syllabus Tracker** — Checklist with progress bars
- 🎓 **Study Assistant** — Curated YouTube videos & reference notes
- 📊 **Dashboard** — Unified overview of all modules
- 🔔 **Smart Reminders** — Background scheduler for class & deadline alerts

## Tech Stack

| Layer | Technology |
|----------|------------------------|
| Frontend | React 18 + Vite |
| Backend | Python Flask |
| Database | SQLite |
| Auth | JWT (Flask-JWT-Extended) |
| Scheduler | APScheduler |

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Open in Browser

Go to `http://localhost:5173` — Sign up and start using!

## CSV Upload Format

For timetable CSV uploads, use this format:

```csv
day,subject,start_time,end_time,room
Monday,Mathematics,09:00,10:00,Room 101
Monday,Physics,10:30,11:30,Room 203
Tuesday,Chemistry,09:00,10:00,Lab 1
```

## Project Structure

```
Project Student/
├── backend/
│   ├── app.py              # Main Flask server
│   ├── config.py           # Configuration
│   ├── models.py           # Database schema
│   ├── routes/             # API route handlers
│   │   ├── auth.py
│   │   ├── timetable.py
│   │   ├── homework.py
│   │   ├── assignments.py
│   │   ├── certificates.py
│   │   └── syllabus.py
│   ├── services/           # Background services
│   │   ├── scheduler.py
│   │   └── file_handler.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css       # Design system
│   │   ├── context/        # Auth state
│   │   ├── pages/          # All page components
│   │   └── components/     # Shared components
│   └── package.json
└── README.md
```

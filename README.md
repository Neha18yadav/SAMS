
## SAMS — Smart Attendance Management System
SAMS is an AI-powered attendance tracking system that uses face recognition and large language models (LLMs) to automate and analyze attendance in educational institutions.

It replaces traditional roll-calls with a fast, secure, and data-driven solution.

## Features
🤖 AI-Powered Face Recognition
Real-time face detection using OpenCV and Dlib

Automatic attendance marking with confidence scores

Secure storage of facial encodings in SQLite

## AI Insights
Integration with Groq (Llama 3) for attendance analysis

Detects anomalies in student attendance

Provides actionable suggestions for faculty

## Analytics & Dashboard
Separate dashboards for Admin and Students

Attendance visualization using Chart.js

Leave request and approval system

## User Experience
Clean UI with dark/light mode

Fully responsive design

Modern glassmorphism styling

## Tech Stack
## Frontend
React 19

Vite

Tailwind CSS

Chart.js

Axios

## Backend
Flask

Flask-SQLAlchemy

Flask-CORS

JWT Authentication

AI & Data
OpenCV

face_recognition

Groq API (Llama 3)

Pandas

## Database
SQLite (SQLAlchemy ORM)

## Project Structure
E-attendance/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── vercel.json
│
├── backend/
│   ├── app/
│   │   ├── camera.py
│   │   ├── routes.py
│   │   ├── models.py
│   │   └── jwt_utils.py
│   ├── requirements.txt
│   └── run.py
│
└── app.db
## Installation & Setup
Prerequisites
Python 3.9+

Node.js 18+

Groq API Key

Backend Setup
cd backend
python -m venv venv

## Activate environment
source venv/bin/activate      (Mac/Linux)
venv\Scripts\activate         (Windows)

pip install -r requirements.txt

## Create .env file
GROQ_API_KEY=your_key_here

python run.py
Frontend Setup
cd frontend
npm install
npm run dev
## Technical Highlights
Optimized face recognition for real-time performance

Secure JWT-based authentication

Fast facial matching using encoded NumPy arrays

AI-powered insights using structured prompts

Data analysis with Pandas

## Use Cases
Schools and Colleges

Coaching Institutes

Corporate Training

## Support
If you like this project, give it a star on GitHub ⭐

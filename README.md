# SAMS — Smart Attendance Management System

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

SAMS is an enterprise-grade, AI-powered attendance tracking platform that combines **Biometric Face Recognition** with **Large Language Models (LLMs)** to automate, secure, and analyze attendance in educational environments.

---

## 🚀 Key Features

### 🤖 Intelligent Biometrics
*   **Real-time Recognition:** High-speed face detection using OpenCV and Dlib.
*   **Confidence Scoring:** Automatic attendance marking with precision-adjusted confidence intervals.
*   **Biometric Security:** Facial encodings are securely pickled and stored in an encrypted-ready SQLite architecture.

### 🧠 SAMS AI Engine
*   **Analysis:** Powered by **Groq (Llama 3)** for deep-dive attendance pattern analysis.
*   **Anomaly Detection:** Automatically flags irregular attendance patterns and shifts in student behavior.
*   **Actionable Insights:** Generates strategic recommendations for faculty to improve engagement.

### 📊 Professional Analytics
*   **Interactive Dashboards:** Dedicated, high-performance interfaces for both Faculty and Students.
*   **Visual Trends:** Real-time data visualization using Chart.js.
*   **Digital Governance:** Built-in leave request management and approval workflow.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS (Modern Glassmorphism)
- **Icons:** Lucide React
- **Charts:** Chart.js + React-Chartjs-2
- **State Management:** React Context API

### Backend
- **Core:** Flask (Python)
- **Database:** SQLAlchemy (SQLite)
- **Security:** JWT (JSON Web Tokens) & Werkzeug Password Hashing
- **AI/ML:** OpenCV, Face_recognition, Groq API
- **Data:** Pandas & NumPy

---

## 📁 Project Structure

```text
E-attendance/
├── frontend/              # React Application (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI Components
│   │   ├── pages/         # Dashboard, AI Insights, Students, etc.
│   │   └── context/       # Auth and Global State
│   └── public/            # Static Assets
│
├── backend/               # Flask API
│   ├── app/
│   │   ├── camera.py      # Face Recognition Logic
│   │   ├── routes.py      # API Endpoints
│   │   ├── models.py      # DB Schema
│   │   └── jwt_utils.py   # Auth Utilities
│   ├── instance/          # Local Configuration
│   └── run.py             # Entry Point
│
└── app.db                 # Primary Data Storage
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- A [Groq API Key](https://console.groq.com/) (for AI features)

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=your_key_here" > .env

# Initialize Database & Admin (Required)
python3 setup_admin.py

# Run the server
python run.py
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run in development mode
npm run dev
```

---

## 🔐 Default Credentials

After running `setup_admin.py`, you can log in with:
- **Username:** `admin`
- **Password:** `admin`

---

## 🛡️ Technical Highlights

*   **Optimization:** Uses facial matching against pre-encoded NumPy arrays for sub-millisecond recognition.
*   **Scalability:** Modular architecture allowing for easy integration of additional biometric sensors.
*   **AI Context:** Custom-built prompt engineering that injects real-time DB context into LLM queries.

---

## 🌟 Support & Contribution

If you find this project useful, please consider giving it a **Star** on GitHub!

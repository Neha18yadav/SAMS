from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
from dotenv import load_dotenv
import os

load_dotenv()  # Load .env (GROQ_API_KEY etc.) before app creation


db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        r"https://.*\.vercel\.app",
        # Add your custom Vercel domain here if you have one, e.g.:
        # "https://sams.yourdomain.com",
    ], supports_credentials=True)

    # Register blueprints (to be created)
    from app.routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app

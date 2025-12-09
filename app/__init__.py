from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret")

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # 모델 import (migrate가 모델을 알도록)
    from app import models  # noqa: F401

    # 블루프린트 등록
    from app.routes import bp as todo_bp
    from app.user_routes import bp as user_bp

    app.register_blueprint(todo_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/auth")

    @app.route("/")
    def index():
        return {"message": "OK"}

    return app

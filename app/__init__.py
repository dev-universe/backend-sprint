import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# --- Extensions ---
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app():
    # Load environment variables
    load_dotenv()

    app = Flask(__name__)

    # CORS
    CORS(app)

    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret")

    # Logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Import models so Alembic can detect them
    from app import models  # noqa: F401

    # Register blueprints
    from app.routes import bp as todo_bp
    from app.user_routes import bp as user_bp

    app.register_blueprint(todo_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/auth")

    # Root healthcheck route
    @app.route("/")
    def index():
        return {"message": "backend running"}

    # --- Global Error Handlers ---
    from app.utils import error

    @app.errorhandler(404)
    def not_found(e):
        return error("resource not found", 404)

    @app.errorhandler(400)
    def bad_request(e):
        return error("bad request", 400)

    @app.errorhandler(500)
    def server_error(e):
        return error("internal server error", 500)

    return app

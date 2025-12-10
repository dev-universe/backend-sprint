import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from app.config import config_by_name

# --- Extensions ---
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app(config_name="dev"):

    # Load environment variables
    load_dotenv()

    app = Flask(__name__)

    # CORS
    CORS(app)

    # Load Config Object
    app.config.from_object(config_by_name[config_name])
    
    # Config
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
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
    from app.api.v1.todo_routes import bp as todo_bp
    from app.api.v1.auth_routes import bp as user_bp

    app.register_blueprint(todo_bp, url_prefix="/api/v1")
    app.register_blueprint(user_bp, url_prefix="/api/v1/auth")

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

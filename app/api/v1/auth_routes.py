import logging
from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from app import db
from app.models import User
from app.utils import success, error  # 공통 응답 유틸

bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return error("username and password are required", 400)

    if User.query.filter_by(username=username).first():
        return error("user already exists", 400)

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    logger.info("user registered: %s", username)

    return success(message="user created"), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return error("username and password are required", 400)

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        logger.info("failed login for user: %s", username)
        return error("invalid credentials", 401)

    access_token = create_access_token(identity=str(user.id))

    logger.info("user logged in: %s", username)

    return success(data={"access_token": access_token}, message="login success")

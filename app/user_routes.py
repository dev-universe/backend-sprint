from flask import Blueprint, request
from app import db
from app.models import User
from flask_jwt_extended import create_access_token

bp = Blueprint("auth", __name__)


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"message": "username and password are required"}, 400

    if User.query.filter_by(username=username).first():
        return {"message": "user already exists"}, 400

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return {"message": "user created"}, 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"message": "username and password are required"}, 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return {"message": "invalid credentials"}, 401

    access_token = create_access_token(identity=str(user.id))
    return {"access_token": access_token}

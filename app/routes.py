from flask import Blueprint, request
from app import db
from app.models import Todo
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint("todo", __name__)


@bp.route("/todos", methods=["GET"])
@jwt_required()
def get_todos():
    user_id = int(get_jwt_identity())
    todos = Todo.query.filter_by(user_id=user_id).all()
    return {"todos": [t.to_dict() for t in todos]}


@bp.route("/todos", methods=["POST"])
@jwt_required()
def create_todo():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return {"message": "title is required"}, 400

    todo = Todo(title=title, user_id=user_id)
    db.session.add(todo)
    db.session.commit()
    return todo.to_dict(), 201


@bp.route("/todos/<int:todo_id>", methods=["PUT"])
@jwt_required()
def update_todo(todo_id):
    user_id = int(get_jwt_identity())
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first_or_404()

    data = request.get_json() or {}
    if "title" in data:
        todo.title = data["title"]
    if "done" in data:
        todo.done = data["done"]

    db.session.commit()
    return todo.to_dict()


@bp.route("/todos/<int:todo_id>", methods=["DELETE"])
@jwt_required()
def delete_todo(todo_id):
    user_id = int(get_jwt_identity())
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first_or_404()

    db.session.delete(todo)
    db.session.commit()
    return {"deleted": True}
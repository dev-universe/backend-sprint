import logging
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Todo
from app.utils import success, error

bp = Blueprint("todo", __name__)
logger = logging.getLogger(__name__)


@bp.route("/todos", methods=["GET"])
@jwt_required()
def get_todos():
    user_id = int(get_jwt_identity())
    todos = Todo.query.filter_by(user_id=user_id).order_by(Todo.id.desc()).all()
    logger.info("get_todos: user_id=%s count=%s", user_id, len(todos))
    return success(
        data=[t.to_dict() for t in todos],
        message="todos fetched",
    )


@bp.route("/todos", methods=["POST"])
@jwt_required()
def create_todo():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    title = data.get("title")

    if not title or not isinstance(title, str):
        return error("title is required and must be a string", 400)

    todo = Todo(title=title, user_id=user_id)
    db.session.add(todo)
    db.session.commit()

    logger.info("create_todo: user_id=%s todo_id=%s", user_id, todo.id)

    return success(data=todo.to_dict(), message="todo created"), 201


@bp.route("/todos/<int:todo_id>", methods=["PUT"])
@jwt_required()
def update_todo(todo_id):
    user_id = int(get_jwt_identity())
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    if not todo:
        return error("todo not found", 404)

    data = request.get_json() or {}

    if "title" in data:
        if not isinstance(data["title"], str):
            return error("title must be a string", 400)
        todo.title = data["title"]

    if "done" in data:
        if not isinstance(data["done"], bool):
            return error("done must be a boolean", 400)
        todo.done = data["done"]

    db.session.commit()

    logger.info("update_todo: user_id=%s todo_id=%s", user_id, todo.id)

    return success(data=todo.to_dict(), message="todo updated")


@bp.route("/todos/<int:todo_id>", methods=["DELETE"])
@jwt_required()
def delete_todo(todo_id):
    user_id = int(get_jwt_identity())
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    if not todo:
        return error("todo not found", 404)

    db.session.delete(todo)
    db.session.commit()

    logger.info("delete_todo: user_id=%s todo_id=%s", user_id, todo_id)

    return success(message="todo deleted")

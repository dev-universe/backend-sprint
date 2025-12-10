import logging
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Todo
from app.utils import success, error

bp = Blueprint("todo", __name__)
logger = logging.getLogger(__name__)
VALID_PRIORITIES = {"low", "normal", "high"}

def parse_due_date(value: str | None):
    if value is None:
        return None
    from datetime import date

    try:
        year, month, day = map(int, value.split("-"))  # "2025-12-31" 형식 기대
        return date(year, month, day)
    except Exception:
        return None

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
    description = data.get("description")
    priority = data.get("priority", "normal")
    due_date_raw = data.get("due_date")

    # title 검증
    if not title or not isinstance(title, str):
        return error("title is required and must be a string", 400)

    # description 검증
    if description is not None and not isinstance(description, str):
        return error("description must be a string if provided", 400)

    # priority 검증
    if priority not in VALID_PRIORITIES:
        return error("priority must be one of: low, normal, high", 400)

    # due_date 검증 + 파싱
    due_date = None
    if due_date_raw is not None:
        if not isinstance(due_date_raw, str):
            return error("due_date must be a string in YYYY-MM-DD format", 400)
        due_date = parse_due_date(due_date_raw)
        if due_date is None:
            return error("due_date must be valid date in YYYY-MM-DD format", 400)

    todo = Todo(
        title=title,
        description=description,
        priority=priority,
        due_date=due_date,
        user_id=user_id,
    )
    db.session.add(todo)
    db.session.commit()

    logger.info(
        "create_todo: user_id=%s todo_id=%s priority=%s due_date=%s",
        user_id,
        todo.id,
        todo.priority,
        todo.due_date,
    )

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

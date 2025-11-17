from flask import Blueprint, request
from app import db
from app.models import Todo

bp = Blueprint("todo", __name__)

@bp.route("/todos", methods=["GET"])
def get_todos():
    todos = Todo.query.all()
    return {"todos": [t.to_dict() for t in todos]}

@bp.route("/todos", methods=["POST"])
def create_todo():
    data = request.get_json()
    todo = Todo(title=data["title"])
    db.session.add(todo)
    db.session.commit()
    return todo.to_dict(), 201

@bp.route("/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json()
    todo.title = data.get("title", todo.title)
    todo.done = data.get("done", todo.done)
    db.session.commit()
    return todo.to_dict()

@bp.route("/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return {"deleted": True}
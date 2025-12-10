const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000/api/v1";

console.log("API_BASE_URL =", API_BASE_URL);

export type Priority = "low" | "normal" | "high";

export interface Todo {
  id: number;
  title: string;
  done: boolean;
  user_id: number;
  created_at: string;
  description: string | null;
  priority: Priority;
  due_date: string | null; // "YYYY-MM-DD" 또는 null
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function register(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export interface TodoFilterOptions {
  done?: boolean;
  priority?: Priority;
  order?: "asc" | "desc";
}

export async function fetchTodos(
  token: string,
  options: TodoFilterOptions = {}
): Promise<ApiResponse<Todo[]>> {
  const params = new URLSearchParams();

  if (options.done !== undefined) {
    params.set("done", options.done ? "true" : "false");
  }
  if (options.priority) {
    params.set("priority", options.priority);
  }
  if (options.order) {
    params.set("order", options.order);
  }

  const query = params.toString();
  const url = query
    ? `${API_BASE_URL}/todos?${query}`
    : `${API_BASE_URL}/todos`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string; // "YYYY-MM-DD"
}

export async function createTodo(
  token: string,
  payload: CreateTodoPayload
): Promise<ApiResponse<Todo>> {
  const res = await fetch(`${API_BASE_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function toggleTodo(
  token: string,
  todo: Todo
): Promise<ApiResponse<Todo>> {
  const res = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ done: !todo.done }),
  });
  return res.json();
}

export async function deleteTodoApi(
  token: string,
  id: number
): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE_URL}/todos/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

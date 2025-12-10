import { useEffect, useState } from "react";
import {
  register,
  login,
  fetchTodos,
  createTodo,
  toggleTodo,
  deleteTodoApi,
  type Todo,
} from "./api";

function App() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("access_token");
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [todoMessage, setTodoMessage] = useState<string | null>(null);
  const [loadingTodos, setLoadingTodos] = useState(false);

  // 토큰이 있으면 자동으로 Todo 가져오기
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingTodos(true);
      try {
        const res = await fetchTodos(token);
        if (res.success) {
          setTodos(res.data);
          setTodoMessage(null);
        } else {
          setTodoMessage(res.message);
        }
      } catch (e) {
        setTodoMessage("failed to fetch todos");
      } finally {
        setLoadingTodos(false);
      }
    })();
  }, [token]);

  const handleRegister = async () => {
    setAuthMessage(null);
    const res = await register(username, password);
    if (res.success) {
      setAuthMessage("회원가입 성공! 이제 로그인하세요.");
    } else {
      setAuthMessage(res.message || "회원가입 실패");
    }
  };

  const handleLogin = async () => {
    setAuthMessage(null);
    const res = await login(username, password);
    if (res.success && res.data?.access_token) {
      const t = res.data.access_token;
      setToken(t);
      localStorage.setItem("access_token", t);
      setAuthMessage("로그인 성공");
    } else {
      setAuthMessage(res.message || "로그인 실패");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("access_token");
    setTodos([]);
    setAuthMessage("로그아웃 완료");
  };

  const handleCreateTodo = async () => {
    if (!token) return;
    if (!newTitle.trim()) {
      setTodoMessage("할 일을 입력하세요.");
      return;
    }
    const res = await createTodo(token, newTitle.trim());
    if (res.success) {
      setTodos((prev) => [res.data, ...prev]);
      setNewTitle("");
      setTodoMessage(null);
    } else {
      setTodoMessage(res.message || "todo 생성 실패");
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    if (!token) return;
    const res = await toggleTodo(token, todo);
    if (res.success) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? res.data : t)));
    } else {
      setTodoMessage(res.message || "todo 업데이트 실패");
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!token) return;
    const res = await deleteTodoApi(token, id);
    if (res.success) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTodoMessage(res.message || "todo 삭제 실패");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Backend Sprint Demo</h1>

      {/* Auth 영역 */}
      <section style={{ border: "1px solid #ddd", padding: 16, marginBottom: 24 }}>
        <h2>Authentication</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
          <input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRegister}>회원가입</button>
            <button onClick={handleLogin}>로그인</button>
            {token && <button onClick={handleLogout}>로그아웃</button>}
          </div>
          {authMessage && <p style={{ color: "#555" }}>{authMessage}</p>}
          <p>현재 상태: {token ? "로그인됨" : "로그인 안 됨"}</p>
        </div>
      </section>

      {/* Todo 영역 */}
      <section style={{ border: "1px solid #ddd", padding: 16 }}>
        <h2>Todos</h2>
        {!token && <p>Todo를 보려면 먼저 로그인 해주세요.</p>}

        {token && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                placeholder="할 일을 입력하세요"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={handleCreateTodo}>추가</button>
            </div>

            {todoMessage && <p style={{ color: "red" }}>{todoMessage}</p>}
            {loadingTodos && <p>로딩 중...</p>}

            <ul style={{ listStyle: "none", padding: 0 }}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                  }}
                >
                  <span
                    onClick={() => handleToggleTodo(todo)}
                    style={{
                      textDecoration: todo.done ? "line-through" : "none",
                      cursor: "pointer",
                    }}
                  >
                    {todo.title}
                  </span>
                  <button onClick={() => handleDeleteTodo(todo.id)}>삭제</button>
                </li>
              ))}
              {todos.length === 0 && !loadingTodos && <li>등록된 할 일이 없습니다.</li>}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default App;

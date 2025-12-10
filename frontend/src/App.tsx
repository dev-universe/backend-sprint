import { useEffect, useRef, useState } from "react";
import {
  register,
  login,
  fetchTodos,
  createTodo,
  toggleTodo,
  deleteTodoApi,
  type Todo,
  type Priority,
} from "./api";

type FilterDone = "all" | "done" | "undone";
type FilterPriority = "all" | Priority;
type Order = "asc" | "desc";

function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("access_token");
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<"idle" | "login" | "register">(
    "idle"
  );

  // Todo state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [todoMessage, setTodoMessage] = useState<string | null>(null);

  // 새 Todo 입력 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueDate, setDueDate] = useState(""); // "YYYY-MM-DD"
  const [createLoading, setCreateLoading] = useState(false);

  // 필터 상태
  const [filterDone, setFilterDone] = useState<FilterDone>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [order, setOrder] = useState<Order>("desc");

  // UX: 포커스 제어용 ref
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // 토큰 또는 필터 변경 시 Todo 재조회
  useEffect(() => {
    if (!token) return;

    (async () => {
      setLoadingTodos(true);
      try {
        const res = await fetchTodos(token, {
          done:
            filterDone === "all"
              ? undefined
              : filterDone === "done"
              ? true
              : false,
          priority: filterPriority === "all" ? undefined : filterPriority,
          order,
        });

        if (res.success) {
          setTodos(res.data);
          setTodoMessage(null);
        } else {
          setTodoMessage(res.message);
        }
      } catch (e) {
        console.error(e);
        setTodoMessage("failed to fetch todos");
      } finally {
        setLoadingTodos(false);
      }
    })();
  }, [token, filterDone, filterPriority, order]);

  // 첫 진입 시 사용자명 입력 포커스
  useEffect(() => {
    if (!token && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [token]);

  // Auth handlers
  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setAuthMessage("username과 password를 입력하세요.");
      return;
    }

    setAuthMessage(null);
    setAuthLoading("register");
    try {
      const res = await register(username, password);
      if (res.success) {
        setAuthMessage("회원가입 성공! 이제 로그인하세요.");
      } else {
        setAuthMessage(res.message || "회원가입 실패");
      }
    } catch (e) {
      console.error(e);
      setAuthMessage("회원가입 중 오류가 발생했습니다.");
    } finally {
      setAuthLoading("idle");
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setAuthMessage("username과 password를 입력하세요.");
      return;
    }

    setAuthMessage(null);
    setAuthLoading("login");
    try {
      const res = await login(username, password);
      if (res.success && res.data?.access_token) {
        const t = res.data.access_token;
        setToken(t);
        localStorage.setItem("access_token", t);
        setAuthMessage("로그인 성공");

        // UX: 로그인 성공 후 Todo 입력란으로 포커스 이동
        setTimeout(() => {
          if (titleInputRef.current) {
            titleInputRef.current.focus();
          }
        }, 0);
      } else {
        setAuthMessage(res.message || "로그인 실패");
      }
    } catch (e) {
      console.error(e);
      setAuthMessage("로그인 중 오류가 발생했습니다.");
    } finally {
      setAuthLoading("idle");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("access_token");
    setTodos([]);
    setAuthMessage("로그아웃 완료");

    // UX: 로그아웃 후 username 입력으로 포커스
    setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
      }
    }, 0);
  };

  // Todo handlers
  const handleCreateTodo = async () => {
    if (!token || createLoading) return;

    if (!title.trim()) {
      setTodoMessage("할 일 제목을 입력하세요.");
      return;
    }

    setCreateLoading(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
    };

    try {
      const res = await createTodo(token, payload);
      if (res.success) {
        setTodos((prev) => [res.data, ...prev]);
        setTitle("");
        setDescription("");
        setPriority("normal");
        setDueDate("");
        setTodoMessage(null);

        // UX: 새 Todo 추가 후 제목 입력란에 다시 포커스
        setTimeout(() => {
          if (titleInputRef.current) {
            titleInputRef.current.focus();
          }
        }, 0);
      } else {
        setTodoMessage(res.message || "todo 생성 실패");
      }
    } catch (e) {
      console.error(e);
      setTodoMessage("todo 생성 중 오류가 발생했습니다.");
    } finally {
      setCreateLoading(false);
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

  // Enter 키로 todo 추가
  const handleTitleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTodo();
    }
  };

  const priorityLabel = (p: Priority) => {
    if (p === "high") return "HIGH";
    if (p === "low") return "LOW";
    return "NORMAL";
  };

  const priorityColor = (p: Priority) => {
    if (p === "high") return "#d9534f";
    if (p === "low") return "#5bc0de";
    return "#5cb85c";
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1>Backend Sprint – Todo Dashboard</h1>

      {/* Auth 섹션 */}
      <section
        style={{
          border: "1px solid #ddd",
          padding: 16,
          marginBottom: 24,
          borderRadius: 8,
        }}
      >
        <h2>Authentication</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
          <input
            ref={usernameInputRef}
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={authLoading !== "idle"}
          />
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={authLoading !== "idle"}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleRegister}
              disabled={authLoading !== "idle"}
            >
              {authLoading === "register" ? "회원가입 중..." : "회원가입"}
            </button>
            <button onClick={handleLogin} disabled={authLoading !== "idle"}>
              {authLoading === "login" ? "로그인 중..." : "로그인"}
            </button>
            {token && (
              <button onClick={handleLogout} disabled={authLoading !== "idle"}>
                로그아웃
              </button>
            )}
          </div>
          {authMessage && <p style={{ color: "#555" }}>{authMessage}</p>}
          <p>현재 상태: {token ? "로그인됨" : "로그인 안 됨"}</p>
        </div>
      </section>

      {/* Todo 섹션 */}
      <section
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
        }}
      >
        <h2>Todos</h2>
        {!token && <p>Todo를 보려면 먼저 로그인 해주세요.</p>}

        {token && (
          <>
            {/* 새 Todo 입력 폼 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <input
                ref={titleInputRef}
                placeholder="할 일 제목 (Enter로 추가 가능)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                disabled={createLoading}
              />
              <textarea
                placeholder="설명 (선택)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={createLoading}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div>
                  <label style={{ marginRight: 4 }}>우선순위</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    disabled={createLoading}
                  >
                    <option value="low">낮음</option>
                    <option value="normal">보통</option>
                    <option value="high">높음</option>
                  </select>
                </div>
                <div>
                  <label style={{ marginRight: 4 }}>마감일</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={createLoading}
                  />
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <button onClick={handleCreateTodo} disabled={createLoading}>
                    {createLoading ? "추가 중..." : "추가"}
                  </button>
                </div>
              </div>
            </div>

            {/* 필터/정렬 */}
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <label style={{ marginRight: 4 }}>완료 상태</label>
                <select
                  value={filterDone}
                  onChange={(e) => setFilterDone(e.target.value as FilterDone)}
                >
                  <option value="all">전체</option>
                  <option value="undone">미완료</option>
                  <option value="done">완료</option>
                </select>
              </div>
              <div>
                <label style={{ marginRight: 4 }}>우선순위</label>
                <select
                  value={filterPriority}
                  onChange={(e) =>
                    setFilterPriority(e.target.value as FilterPriority)
                  }
                >
                  <option value="all">전체</option>
                  <option value="high">높음</option>
                  <option value="normal">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>
              <div>
                <label style={{ marginRight: 4 }}>정렬(마감일)</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as Order)}
                >
                  <option value="desc">최근 마감일 우선</option>
                  <option value="asc">먼저 마감일 우선</option>
                </select>
              </div>
            </div>

            {todoMessage && <p style={{ color: "red" }}>{todoMessage}</p>}
            {loadingTodos && <p>로딩 중...</p>}

            {/* Todo 리스트 */}
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px 4px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        onClick={() => handleToggleTodo(todo)}
                        style={{
                          textDecoration: todo.done ? "line-through" : "none",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {todo.title}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: priorityColor(todo.priority),
                          color: "#fff",
                        }}
                      >
                        {priorityLabel(todo.priority)}
                      </span>
                      {todo.due_date && (
                        <span style={{ fontSize: 12, color: "#555" }}>
                          마감: {todo.due_date}
                        </span>
                      )}
                    </div>
                    {todo.description && (
                      <div style={{ fontSize: 14, color: "#444" }}>
                        {todo.description}
                      </div>
                    )}
                  </div>
                  <div>
                    <button onClick={() => handleDeleteTodo(todo.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
              {todos.length === 0 && !loadingTodos && (
                <li>등록된 할 일이 없습니다.</li>
              )}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default App;

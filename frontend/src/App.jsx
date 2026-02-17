import { useEffect, useMemo, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "";

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const statuses = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" }
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }
      const query = params.toString();
      const url = query
        ? `${apiUrl}/api/tasks?${query}`
        : `${apiUrl}/api/tasks`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter]);

  async function handleCreateTask(event) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate || undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      const created = await response.json();
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setTasks((current) => [created, ...current]);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function updateTask(id, updates) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      const updated = await response.json();
      setTasks((current) =>
        current.map((task) => (task.id === id ? updated : task))
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/tasks/${id}`, {
        method: "DELETE"
      });
      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete task");
      }
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const groupedTasks = useMemo(() => {
    const groups = {
      todo: [],
      "in-progress": [],
      done: []
    };
    for (const task of tasks) {
      groups[task.status]?.push(task);
    }
    return groups;
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (!tasks.length) {
      return 0;
    }
    const doneCount = tasks.filter((task) => task.status === "done").length;
    return Math.round((doneCount / tasks.length) * 100);
  }, [tasks]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "24px"
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#020617",
            border: "1px solid #1f2937",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}
        >
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
            Docker Practice Task Board
          </h1>
          <p
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              color: "#9ca3af"
            }}
          >
            Full-stack MERN example with filtering, derived state, and MongoDB
            persistence.
          </p>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px"
              }}
            >
              <span>Completion</span>
              <span>{completionRate}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "999px",
                backgroundColor: "#020617",
                border: "1px solid #1f2937",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${completionRate}%`,
                  height: "100%",
                  background:
                    "linear-gradient(to right, #22c55e, #a3e635, #22c55e)"
                }}
              />
            </div>
          </div>
          <form onSubmit={handleCreateTask} style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: "8px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  color: "#9ca3af"
                }}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Set up Docker network"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "14px"
                }}
              />
            </div>
            <div style={{ marginBottom: "8px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  color: "#9ca3af"
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this deployment task does"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "12px"
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "4px",
                    color: "#9ca3af"
                  }}
                >
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: "14px"
                  }}
                >
                  {priorities.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "4px",
                    color: "#9ca3af"
                  }}
                >
                  Due date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#22c55e",
                color: "#022c22",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                opacity: loading ? 0.6 : 1
              }}
            >
              Add task
            </button>
          </form>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#9ca3af"
              }}
            >
              <span>Backend URL</span>
              <code>{apiUrl}</code>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px"
              }}
            >
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "14px"
                }}
              >
                <option value="all">All statuses</option>
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "14px"
                }}
              >
                <option value="all">All priorities</option>
                {priorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading && (
            <p
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#9ca3af"
              }}
            >
              Syncing with backend...
            </p>
          )}
          {error && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#f97316"
              }}
            >
              {error}
            </p>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px"
          }}
        >
          {statuses.map((column) => (
            <div
              key={column.value}
              style={{
                borderRadius: "12px",
                backgroundColor: "#020617",
                border: "1px solid #1f2937",
                padding: "12px",
                minHeight: "160px",
                boxShadow: "0 16px 30px rgba(0,0,0,0.4)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px"
                }}
              >
                <h2
                  style={{
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#9ca3af"
                  }}
                >
                  {column.label}
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280"
                  }}
                >
                  {groupedTasks[column.value].length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                {groupedTasks[column.value].map((task) => {
                  const priorityColor =
                    task.priority === "high"
                      ? "#f97316"
                      : task.priority === "medium"
                      ? "#22c55e"
                      : "#38bdf8";
                  const dueDateLabel = task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : null;
                  return (
                    <div
                      key={task.id}
                      style={{
                        borderRadius: "10px",
                        border: "1px solid #1f2937",
                        background:
                          "radial-gradient(circle at top left, rgba(56,189,248,0.1), transparent 60%), #020617",
                        padding: "10px"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "999px",
                              backgroundColor: priorityColor
                            }}
                          />
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 500
                            }}
                          >
                            {task.title}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#6b7280",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      {task.description && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginBottom: "4px"
                          }}
                        >
                          {task.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "4px"
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af"
                          }}
                        >
                          Priority: {task.priority}
                          {dueDateLabel ? ` • Due: ${dueDateLabel}` : ""}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px"
                          }}
                        >
                          {statuses
                            .filter((option) => option.value !== task.status)
                            .map((option) => (
                              <button
                                key={option.value}
                                onClick={() =>
                                  updateTask(task.id, { status: option.value })
                                }
                                style={{
                                  border: "none",
                                  borderRadius: "999px",
                                  padding: "2px 8px",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  backgroundColor: "#0f172a",
                                  color: "#e5e7eb"
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!groupedTasks[column.value].length && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280"
                    }}
                  >
                    No tasks in this column.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import "./TechnicianTickets.css";

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div className={`tt-toast tt-toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="tt-toast-close">×</button>
  </div>
);

// ─── Status badge colour map ──────────────────────────────────────────────────
const STATUS_CLASS = {
  OPEN: "tt-badge-open",
  IN_PROGRESS: "tt-badge-progress",
  RESOLVED: "tt-badge-resolved",
  CLOSED: "tt-badge-closed",
  REJECTED: "tt-badge-rejected",
};

const PRIORITY_CLASS = {
  HIGH: "tt-pri-high",
  MEDIUM: "tt-pri-medium",
  LOW: "tt-pri-low",
};

// ─── Inline quick-update panel ───────────────────────────────────────────────
const QuickUpdate = ({ ticket, onUpdated, onCancel, showToast }) => {
  const [status, setStatus] = useState(ticket.status);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!status) return;
    setSaving(true);
    try {
      const params = new URLSearchParams({ status });
      if (notes.trim()) params.append("notes", notes.trim());
      await api.put(`/api/tickets/${ticket.id}/status?${params}`);
      showToast(`Ticket #${ticket.id} updated to ${status.replace("_", " ")}`, "success");
      onUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tt-quick-update">
      <h4>Quick Update — #{ticket.id}: {ticket.title}</h4>
      <div className="tt-qu-row">
        <div className="tt-qu-field">
          <label>New Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="tt-qu-field tt-qu-notes">
          <label>
            {status === "RESOLVED" ? "Resolution Notes" : "Progress Notes"}{" "}
            {status === "RESOLVED" && <span className="tt-required">(recommended)</span>}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={
              status === "RESOLVED"
                ? "Describe what was done to resolve the issue..."
                : "Add a progress note (optional)..."
            }
          />
        </div>
      </div>
      <div className="tt-qu-actions">
        <button onClick={submit} disabled={saving} className="tt-btn tt-btn-primary">
          {saving ? "Saving…" : "Save Update"}
        </button>
        <button onClick={onCancel} className="tt-btn tt-btn-ghost">Cancel</button>
        <Link to={`/tickets/${ticket.id}`} className="tt-btn tt-btn-outline">
          Open Full Detail →
        </Link>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const TechnicianTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [activeUpdate, setActiveUpdate] = useState(null); // ticket id with open quick-update
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketsRes, userRes] = await Promise.all([
        api.get("/api/tickets/my-assigned"),
        api.get("/user/me"),
      ]);
      setTickets(ticketsRes.data);
      setUser(userRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
      } else {
        showToast("Failed to load your tickets.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = {
    total: tickets.length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
    open: tickets.filter(t => t.status === "OPEN").length,
  };

  const filtered = filter === "ALL"
    ? tickets
    : tickets.filter(t => t.status === filter);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="tt-loading">
      <div className="tt-spinner" />
      <p>Loading your assignments…</p>
    </div>
  );

  return (
    <div className="tt-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="tt-header">
        <div className="tt-header-text">
          <button onClick={() => navigate("/techhome")} className="tt-back-btn">
            ← Dashboard
          </button>
          <h1>My Assigned Tickets</h1>
          <p>
            Welcome, <strong>{user?.firstname} {user?.lastName}</strong> — manage your assigned maintenance tasks below.
          </p>
        </div>
      </header>

      {/* ── Stats cards ────────────────────────────────────────────────── */}
      <div className="tt-stats">
        {[
          { label: "Total Assigned", value: stats.total,      color: "#6366f1" },
          { label: "In Progress",    value: stats.inProgress,  color: "#f59e0b" },
          { label: "Open",           value: stats.open,         color: "#3b82f6" },
          { label: "Resolved",       value: stats.resolved,     color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="tt-stat-card" style={{ borderTopColor: s.color }}>
            <span className="tt-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="tt-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="tt-filter-bar">
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => (
          <button
            key={s}
            className={`tt-filter-btn ${filter === s ? "tt-filter-active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.replace("_", " ")}
            <span className="tt-filter-count">
              {s === "ALL" ? tickets.length : tickets.filter(t => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Ticket list ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="tt-empty">
          <div className="tt-empty-icon">🔧</div>
          <h3>No tickets here</h3>
          <p>
            {filter === "ALL"
              ? "No tickets have been assigned to you yet."
              : `No tickets with status "${filter.replace("_", " ")}".`}
          </p>
        </div>
      ) : (
        <div className="tt-list">
          {filtered.map(ticket => (
            <div key={ticket.id} className="tt-card">
              {/* ── Card header ── */}
              <div className="tt-card-top">
                <div className="tt-card-id-block">
                  <span className="tt-card-id">#{ticket.id}</span>
                  <span className={`tt-badge ${STATUS_CLASS[ticket.status] || ""}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
                <span className={`tt-priority ${PRIORITY_CLASS[ticket.priority] || ""}`}>
                  {ticket.priority}
                </span>
              </div>

              {/* ── Card body ── */}
              <div className="tt-card-body">
                <h3 className="tt-card-title">{ticket.title}</h3>
                <p className="tt-card-desc">
                  {ticket.description?.length > 120
                    ? ticket.description.slice(0, 120) + "…"
                    : ticket.description}
                </p>
                <div className="tt-card-meta">
                  <span>📍 {ticket.location}</span>
                  <span>🗂 {ticket.category}</span>
                  <span>👤 Reported by: {ticket.createdBy}</span>
                  <span>🗓 {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}</span>
                </div>

                {ticket.resolutionNotes && (
                  <div className="tt-resolution-note">
                    <strong>✅ Resolution:</strong> {ticket.resolutionNotes}
                  </div>
                )}
              </div>

              {/* ── Card actions ── */}
              <div className="tt-card-actions">
                {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && ticket.status !== "REJECTED" ? (
                  <button
                    className="tt-btn tt-btn-primary"
                    onClick={() =>
                      setActiveUpdate(activeUpdate === ticket.id ? null : ticket.id)
                    }
                  >
                    {activeUpdate === ticket.id ? "✕ Cancel Update" : "✏ Update Status"}
                  </button>
                ) : (
                  <span className="tt-done-label">
                    {ticket.status === "RESOLVED" ? "✅ Resolved" : "🔒 Closed"}
                  </span>
                )}
                <Link to={`/tickets/${ticket.id}`} className="tt-btn tt-btn-outline">
                  View Full Detail →
                </Link>
              </div>

              {/* ── Inline quick update ── */}
              {activeUpdate === ticket.id && (
                <QuickUpdate
                  ticket={ticket}
                  onUpdated={() => { setActiveUpdate(null); fetchTickets(); }}
                  onCancel={() => setActiveUpdate(null)}
                  showToast={showToast}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianTickets;

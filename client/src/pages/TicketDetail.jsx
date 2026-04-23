import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./TicketDetail.css";

const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [technicians, setTechnicians] = useState([]);

  // Action states
  const [comment, setComment] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTech, setSelectedTech] = useState("");

  // Loading states for actions
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [ticketRes, userRes] = await Promise.all([
        api.get(`/api/tickets/${id}`),
        api.get("/user/me"),
      ]);
      setTicket(ticketRes.data);
      setUser(userRes.data);
      setStatusUpdate(ticketRes.data.status);

      // Fetch assignable users for admin
      if (userRes.data.role === "ADMIN") {
        try {
          const usersRes = await api.get("/api/tickets/assignable-users");
          setTechnicians(usersRes.data);
        } catch (e) {
          console.warn("Could not load assignable users:", e.message);
        }
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
      showToast("Failed to load ticket details.", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPostingComment(true);
    try {
      const params = new URLSearchParams({ message: comment.trim() });
      await api.post(`/api/tickets/${id}/comments?${params.toString()}`);
      setComment("");
      await fetchData();
      showToast("Comment posted successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to post comment.";
      showToast(typeof msg === "string" ? msg : "Failed to post comment.", "error");
      console.error("Comment error:", err.response?.data);
    } finally {
      setPostingComment(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;
    setUpdatingStatus(true);
    try {
      const params = new URLSearchParams({ status: statusUpdate });
      if (notes) params.append("notes", notes);
      await api.put(`/api/tickets/${id}/status?${params.toString()}`);
      setNotes("");
      await fetchData();
      showToast("Status updated successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status.";
      showToast(msg, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignTech = async () => {
    if (!selectedTech) {
      showToast("Please select a user to assign.", "error");
      return;
    }
    setAssigning(true);
    try {
      await api.put(`/api/tickets/${id}/assign?technicianId=${selectedTech}`);
      await fetchData();
      setSelectedTech("");
      showToast("Technician assigned successfully! Ticket is now In Progress.");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to assign. Check server logs.";
      showToast(typeof msg === "string" ? msg : "Failed to assign technician.", "error");
      console.error("Assignment error:", err.response?.data);
    } finally {
      setAssigning(false);
    }
  };

  if (loading)
    return (
      <div className="ticket-detail-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  if (!ticket) return <div className="ticket-detail-wrapper"><div className="alert error">Ticket not found</div></div>;

  const isAdmin = user?.role === "ADMIN";
  // Use loose equality (==) to handle number vs string id mismatch
  // eslint-disable-next-line eqeqeq
  const isAssignedTech = ticket.assignedTechnicianId != null && ticket.assignedTechnicianId == user?.userId;
  const canUpdateStatus = isAdmin || isAssignedTech;

  return (
    <div className="ticket-detail-wrapper">
      <div className="ticket-detail-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="detail-container">
        <aside className="detail-sidebar">
          <button
            onClick={() => navigate("/tickets")}
            className="btn btn-clear back-btn"
          >
            ← Back to Tickets
          </button>

          <div className="detail-status-card glass-panel">
            <h3>Status Control</h3>
            <div className={`status-banner ${ticket.status.toLowerCase()}`}>
              {ticket.status.replace(/_/g, " ")}
            </div>

            {canUpdateStatus && (
              <div className="status-actions">
                <label>Update Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  {isAdmin && <option value="REJECTED">Rejected</option>}
                  <option value="CLOSED">Closed</option>
                </select>
                <textarea
                  placeholder={
                    statusUpdate === "REJECTED"
                      ? "Rejection reason (required)..."
                      : "Add resolution notes (optional)..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <button
                  onClick={handleStatusUpdate}
                  className="btn btn-primary"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="assignment-actions">
                <label>
                  Assign Technician
                  {ticket.assignedTechnician && ticket.assignedTechnician !== "Unassigned" && (
                    <span className="currently-assigned">
                      {" "}(Currently: {ticket.assignedTechnician})
                    </span>
                  )}
                </label>
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                >
                  <option value="">
                    {technicians.length === 0
                      ? "No users available"
                      : "Select a user..."}
                  </option>
                  {technicians.map((tech) => (
                    <option key={tech.userId} value={tech.userId}>
                      {tech.firstname} {tech.lastName} ({tech.role})
                    </option>
                  ))}
                </select>
                {technicians.length === 0 && (
                  <p className="no-tech-warning">
                    ⚠️ No assignable users found. Register non-admin users first.
                  </p>
                )}
                <button
                  onClick={handleAssignTech}
                  className="btn btn-view"
                  disabled={assigning || technicians.length === 0}
                >
                  {assigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="detail-main">
          <section className="ticket-info glass-panel">
            <div className="ticket-info-header">
              <span className="ticket-id">#{ticket.id}</span>
              <span className={`priority-tag ${ticket.priority?.toLowerCase()}`}>
                {ticket.priority} Priority
              </span>
            </div>
            <h1>{ticket.title}</h1>
            <div className="ticket-details-grid">
              <div className="detail-item">
                <label>Category</label>
                <p>{ticket.category}</p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{ticket.location}</p>
              </div>
              <div className="detail-item">
                <label>Created By</label>
                <p>{ticket.createdBy}</p>
              </div>
              <div className="detail-item">
                <label>Assigned To</label>
                <p>
                  {ticket.assignedTechnician && ticket.assignedTechnician !== "Unassigned"
                    ? ticket.assignedTechnician
                    : <em style={{ color: "var(--text-muted, #999)" }}>Unassigned</em>}
                </p>
              </div>
              <div className="detail-item">
                <label>Contact</label>
                <p>{ticket.contactNumber || "—"}</p>
              </div>
              <div className="detail-item">
                <label>Created</label>
                <p>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}</p>
              </div>
            </div>

            <div className="ticket-description">
              <label>Description</label>
              <p>{ticket.description}</p>
            </div>

            {ticket.resolutionNotes && (
              <div className="resolution-info success-box">
                <label>Resolution Notes</label>
                <p>{ticket.resolutionNotes}</p>
              </div>
            )}

            {ticket.rejectionReason && (
              <div className="resolution-info danger-box">
                <label>Rejection Reason</label>
                <p>{ticket.rejectionReason}</p>
              </div>
            )}

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="attachments-section">
                <label>Attachments ({ticket.attachments.length})</label>
                <div className="attachments-grid">
                  {ticket.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`${api.defaults.baseURL}/${att.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="attachment-preview"
                    >
                      <div className="img-placeholder">🖼️</div>
                      <span>{att.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="comments-section glass-panel">
            <h3>Discussion ({ticket.comments?.length || 0})</h3>
            <div className="comments-list">
              {ticket.comments?.length === 0 && (
                <p className="no-comments">No comments yet. Be the first!</p>
              )}
              {ticket.comments?.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{c.username}</strong>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{c.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={postingComment}
              >
                {postingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
    </div>
  );
};

export default TicketDetail;

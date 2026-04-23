import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./TicketDashboard.css";

const TicketDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, userRes] = await Promise.all([
          api.get("/api/tickets"),
          api.get("/user/me")
        ]);
        setTickets(ticketsRes.data);
        setUser(userRes.data);
      } catch (err) {
        setError("Failed to load tickets. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTickets = tickets.filter(t => 
    filter === "ALL" || t.status === filter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN": return "status-open";
      case "IN_PROGRESS": return "status-progress";
      case "RESOLVED": return "status-resolved";
      case "CLOSED": return "status-closed";
      case "REJECTED": return "status-rejected";
      default: return "";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "priority-high";
      case "MEDIUM": return "priority-medium";
      case "LOW": return "priority-low";
      default: return "";
    }
  };

  if (loading) return <div className="ticket-dashboard-wrapper"><div className="loading-container"><div className="spinner"></div></div></div>;

  return (
    <div className="ticket-dashboard-wrapper">
      <div className="ticket-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Incident Ticketing</h1>
            <p>Manage and track campus maintenance requests</p>
          </div>
          <Link to="/tickets/create" className="btn btn-primary create-btn">
            <span>+</span> Create New Ticket
          </Link>
        </header>

        <div className="top-bar">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All Tickets</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="stats-group">
            <div className="stat-item">
              <span className="stat-label">Total</span>
              <span className="stat-value">{tickets.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Open</span>
              <span className="stat-value">{tickets.filter(t => t.status === 'OPEN').length}</span>
            </div>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}

        <div className="ticket-grid">
          {filteredTickets.map(ticket => (
            <Link to={`/tickets/${ticket.id}`} key={ticket.id} className="ticket-card glass-panel">
              <div className="ticket-card-header">
                <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`priority-badge ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="ticket-card-body">
                <h3>{ticket.title}</h3>
                <p className="ticket-category">{ticket.category}</p>
                <div className="ticket-meta">
                  <div className="meta-item">
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{ticket.location}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="ticket-card-footer">
                <div className="technician-info">
                  <span className="tech-label">Assigned to:</span>
                  <span className="tech-name">{ticket.assignedTechnician || "Unassigned"}</span>
                </div>
                <span className="view-link">View Details →</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="empty-state glass-panel">
            <p>No tickets found matching the filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDashboard;

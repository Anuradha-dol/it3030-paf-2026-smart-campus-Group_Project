import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./CreateTicket.css";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
    location: "",
    contactNumber: ""
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      setError("You can only upload a maximum of 3 images.");
      return;
    }
    setFiles(selectedFiles);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("ticket", new Blob([JSON.stringify(formData)], { type: "application/json" }));
    files.forEach(file => {
      data.append("files", file);
    });

    try {
      await api.post("/api/tickets", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-wrapper">
      <div className="create-ticket-page">
        <div className="container">
        <header className="form-header">
          <h1>Report an Incident</h1>
          <p>Please provide details about the issue you encountered.</p>
        </header>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Issue Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Briefly describe the problem"
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Network/IT">Network / IT</option>
                <option value="Hardware">Hardware</option>
                <option value="Furniture">Furniture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} required>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location / Resource</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Lab 01, Room 204"
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Your phone number"
              />
            </div>

            <div className="form-group full-width">
              <label>Detailed Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe exactly what happened..."
                rows="5"
                required
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label>Attachments (Max 3 images)</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  id="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                  <span className="upload-icon">📷</span>
                  {files.length > 0 ? `${files.length} files selected` : "Choose Images"}
                </label>
              </div>
              <div className="file-previews">
                {files.map((file, idx) => (
                  <div key={idx} className="file-preview-item">
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/tickets")} className="btn btn-clear">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default CreateTicket;

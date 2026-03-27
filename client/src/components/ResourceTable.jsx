import React from 'react';
import { Link } from 'react-router-dom';

const ResourceTable = ({ resources, onDeleteClick }) => {
    if (!resources || resources.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
                <h3>No resources found</h3>
                <p>Try adjusting your search criteria or add a new resource.</p>
            </div>
        );
    }

    return (
        <div className="resource-grid">
            {resources.map((resource) => (
                <div key={resource.id} className="resource-card glass-panel">
                    <div className="card-header">
                        <div className="card-title-group">
                            <h3>{resource.name}</h3>
                            <span className="badge badge-type">{resource.type?.replace('_', ' ')}</span>
                        </div>
                        <span className={`status-indicator status-${resource.status?.toLowerCase()}`}>
                            {resource.status}
                        </span>
                    </div>

                    <div className="card-body">
                        <div className="info-row">
                            <i className="icon">📍</i>
                            <div className="info-content">
                                <span className="label">Location</span>
                                <span className="value">{resource.location}</span>
                            </div>
                        </div>
                        
                        <div className="info-row">
                            <i className="icon">👥</i>
                            <div className="info-content">
                                <span className="label">Capacity</span>
                                <span className="value">{resource.capacity} {resource.type === 'EQUIPMENT' ? 'units' : 'people'}</span>
                            </div>
                        </div>

                        <div className="info-row">
                            <i className="icon">🕒</i>
                            <div className="info-content">
                                <span className="label">Availability</span>
                                <span className="value">
                                    {resource.availableFrom ? `${resource.availableFrom} - ${resource.availableTo}` : 'Anytime'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer">
                        <div className="action-buttons">
                            <Link to={`/resources/${resource.id}`} className="btn btn-view">
                                View
                            </Link>
                            <Link to={`/resources/edit/${resource.id}`} className="btn btn-edit">
                                Edit
                            </Link>
                            <button onClick={() => onDeleteClick(resource)} className="btn btn-delete">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ResourceTable;

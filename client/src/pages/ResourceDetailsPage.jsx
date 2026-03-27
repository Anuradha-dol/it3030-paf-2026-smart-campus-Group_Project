import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResourceById } from '../services/resourceService';

const ResourceDetailsPage = () => {
    const { id } = useParams();
    const [resource, setResource] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const data = await getResourceById(id);
                setResource(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load resource details.');
            }
        };
        fetchResource();
    }, [id]);

    if (error) return <div className="alert error">{error}</div>;
    if (!resource) return <p>Loading details...</p>;

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="top-bar">
                <h1>Resource Details</h1>
                <Link to="/resources" className="btn btn-clear">Back to List</Link>
            </div>
            
            <div className="details-card" style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <p><strong>ID:</strong> {resource.id}</p>
                <p><strong>Name:</strong> {resource.name}</p>
                <p><strong>Type:</strong> {resource.type}</p>
                <p><strong>Capacity:</strong> {resource.capacity}</p>
                <p><strong>Location:</strong> {resource.location}</p>
                <p><strong>Available From:</strong> {resource.availableFrom || 'N/A'}</p>
                <p><strong>Available To:</strong> {resource.availableTo || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status-${resource.status.toLowerCase()}`}>{resource.status}</span></p>
                <p><strong>Description:</strong> {resource.description || 'No description provided.'}</p>
                
                <div style={{ marginTop: '20px' }}>
                    <Link to={`/resources/edit/${resource.id}`} className="btn btn-primary" style={{ marginRight: '10px' }}>
                        Edit Resource
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailsPage;
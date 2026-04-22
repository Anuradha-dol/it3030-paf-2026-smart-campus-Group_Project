import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getResourceById } from '../services/resourceService';
import api from '../api';
import './ResourceTheme.css';

const resolveResourceImage = (resource) => {
    const rawImage = resource?.imageUrl || resource?.image || resource?.imageBase64 || resource?.resourceImage;
    if (!rawImage || typeof rawImage !== 'string') {
        return '';
    }

    if (rawImage.startsWith('data:image/')) {
        return rawImage;
    }

    return `data:image/jpeg;base64,${rawImage}`;
};

const ResourceDetailsPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const basePath = location.pathname.startsWith('/dashboard/resources') ? '/dashboard/resources' : '/resources';
    const listPath = location.pathname.startsWith('/dashboard/resources') ? '/dashboard' : '/resources';
    const [resource, setResource] = useState(null);
    const [error, setError] = useState('');
    const [role, setRole] = useState('ROLE_USER');

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

    useEffect(() => {
        const loadRole = async () => {
            try {
                const adminRes = await api.get('/user/Admin/me');
                setRole(String(adminRes.data?.role || 'ROLE_ADMIN'));
                return;
            } catch (adminErr) {
                if (adminErr.response?.status === 401) {
                    return;
                }
            }

            try {
                const userRes = await api.get('/user/me');
                setRole(String(userRes.data?.role || 'ROLE_USER'));
            } catch (userErr) {
                if (userErr.response?.status === 401) {
                    return;
                }
            }
        };

        loadRole();
    }, []);

    const isAdmin = role.toUpperCase().includes('ADMIN');

    if (error) return <div className="alert error">{error}</div>;
    if (!resource) return <p>Loading details...</p>;

    const imageSource = resolveResourceImage(resource);

    return (
        <div className="resource-theme-root" style={{ padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="top-bar">
                    <h1>Resource Details</h1>
                    <Link to={listPath} className="btn btn-clear">Back to List</Link>
                </div>
                
                <div className="details-card">
                    <p><strong>ID:</strong> {resource.id}</p>
                    <p><strong>Name:</strong> {resource.name}</p>
                    {imageSource && (
                        <div className="resource-detail-image-wrapper">
                            <img src={imageSource} alt={`${resource.name} preview`} className="resource-detail-image" />
                        </div>
                    )}
                    <p><strong>Type:</strong> {resource.type}</p>
                    <p><strong>Capacity:</strong> {resource.capacity}</p>
                    <p><strong>Location:</strong> {resource.location}</p>
                    <p><strong>Available From:</strong> {resource.availableFrom || 'N/A'}</p>
                    <p><strong>Available To:</strong> {resource.availableTo || 'N/A'}</p>
                    <p><strong>Status:</strong> <span className={`status-${resource.status.toLowerCase()}`}>{resource.status}</span></p>
                    <p><strong>Description:</strong> {resource.description || 'No description provided.'}</p>
                    
                    <div style={{ marginTop: '20px' }}>
                        {isAdmin ? (
                            <Link to={`${basePath}/edit/${resource.id}`} className="btn btn-primary" style={{ marginRight: '10px' }}>
                                Edit Resource
                            </Link>
                        ) : (
                            <button type="button" className="btn btn-primary">
                                Book Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailsPage;
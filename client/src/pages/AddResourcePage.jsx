import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ResourceForm from '../components/ResourceForm';
import { createResource } from '../services/resourceService';
import './ResourceTheme.css';

const AddResourcePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const listPath = location.pathname.startsWith('/dashboard/resources') ? '/dashboard' : '/resources';
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    //handle create resource
    const handleCreate = async (resourceData) => {
        try {
            setIsLoading(true);
            setError(null);

            await createResource(resourceData);
            alert('Resource created successfully!');
            navigate(listPath);
        } catch (err) {
            console.error(err);
            const backendMessage = err?.response?.data?.message || err?.response?.data;
            setError(backendMessage || 'Failed to create resource. Please check your data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="resource-theme-root" style={{ padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="top-bar">
                    <h1>Add New Resource</h1>
                    <Link to={listPath} className="btn btn-clear">Back to List</Link>
                </div>
                
                {error && <div className="alert error">{error}</div>}
                
                <ResourceForm onSubmit={handleCreate} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default AddResourcePage;
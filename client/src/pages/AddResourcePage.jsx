import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ResourceForm from '../components/ResourceForm';
import { createResource } from '../services/resourceService';

const AddResourcePage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    //handle create resource
    const handleCreate = async (resourceData) => {
        try {
            setIsLoading(true);
            setError(null);

            await createResource(resourceData);
            alert('Resource created successfully!');
            navigate('/resources');
        } catch (err) {
            console.error(err);
            const backendMessage = err?.response?.data?.message || err?.response?.data;
            setError(backendMessage || 'Failed to create resource. Please check your data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="top-bar">
                <h1>Add New Resource</h1>
                <Link to="/resources" className="btn btn-clear">Back to List</Link>
            </div>
            
            {error && <div className="alert error">{error}</div>}
            
            <ResourceForm onSubmit={handleCreate} isLoading={isLoading} />
        </div>
    );
};

export default AddResourcePage;
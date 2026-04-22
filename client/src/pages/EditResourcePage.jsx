import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import ResourceForm from '../components/ResourceForm';
import { getResourceById, updateResource } from '../services/resourceService';

const EditResourcePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const listPath = location.pathname.startsWith('/dashboard/resources') ? '/dashboard' : '/resources';
    const [initialData, setInitialData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const data = await getResourceById(id);
                // Backend uses LocalTime and typically returns HH:mm; trim safely if seconds exist.
                if (data.availableFrom) data.availableFrom = data.availableFrom.substring(0, 5);
                if (data.availableTo) data.availableTo = data.availableTo.substring(0, 5);
                
                setInitialData(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load resource data.');
            }
        };
        fetchResource();
    }, [id]);

    const handleUpdate = async (resourceData) => {
        try {
            setIsLoading(true);
            setError(null);

            await updateResource(id, resourceData);
            alert('Resource updated successfully!');
            navigate(listPath);
        } catch (err) {
            console.error(err);
            const backendMessage = err?.response?.data?.message || err?.response?.data;
            setError(backendMessage || 'Failed to update resource. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="top-bar">
                <h1>Edit Resource</h1>
                <Link to={listPath} className="btn btn-clear">Back to List</Link>
            </div>

            {error && <div className="alert error">{error}</div>}

            {initialData ? (
                <ResourceForm 
                    initialData={initialData} 
                    onSubmit={handleUpdate} 
                    isLoading={isLoading} 
                />
            ) : (
                !error && <p>Loading resource data...</p>
            )}
        </div>
    );
};

export default EditResourcePage;
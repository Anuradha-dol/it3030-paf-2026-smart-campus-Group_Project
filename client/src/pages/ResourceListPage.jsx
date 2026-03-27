import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllResources, deleteResource } from '../services/resourceService';
import ResourceTable from '../components/ResourceTable';
import SearchFilterBar from '../components/SearchFilterBar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const ResourceListPage = () => {
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const data = await getAllResources();
            setResources(data);
            setFilteredResources(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch resources. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = ({ text, type, status }) => {
        let filtered = resources;
        
        if (text) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(text.toLowerCase()) || 
                item.location.toLowerCase().includes(text.toLowerCase())
            );
        }
        if (type) {
            filtered = filtered.filter(item => item.type === type);
        }
        if (status) {
            filtered = filtered.filter(item => item.status === status);
        }

        setFilteredResources(filtered);
    };

    const confirmDelete = (resource) => {
        setResourceToDelete(resource);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            await deleteResource(resourceToDelete.id);
            setSuccessMsg('Resource deleted successfully!');
            setIsModalOpen(false);
            setResourceToDelete(null);
            fetchResources(); // Refresh table
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to delete resource.');
            console.error(err);
        }
    };

    return (
        <div className="resource-list-container">
            <h1>Facilities & Assets Catalogue</h1>

            {error && <div className="alert error">{error}</div>}
            {successMsg && <div className="alert success">{successMsg}</div>}

            <div className="top-bar">
                <SearchFilterBar onSearch={handleSearch} />
                <Link to="/resources/add" className="btn btn-primary">
                    + Add New Resource
                </Link>
            </div>

            {loading ? (
                <p>Loading basic info...</p>
            ) : (
                <ResourceTable 
                    resources={filteredResources} 
                    onDeleteClick={confirmDelete} 
                />
            )}

            {isModalOpen && (
                <DeleteConfirmModal 
                    resourceName={resourceToDelete?.name}
                    onConfirm={handleDelete}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ResourceListPage;

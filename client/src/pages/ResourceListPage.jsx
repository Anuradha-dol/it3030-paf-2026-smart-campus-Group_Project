import React, { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllResources, deleteResource } from '../services/resourceService';
import ResourceTable from '../components/ResourceTable';
import SearchFilterBar from '../components/SearchFilterBar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import './ResourceTheme.css';

const ResourceListPage = ({ embedded = false, basePath = '/resources', canManage = true, showBook = false }) => {
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

    const handleSearch = useCallback(({ location, type, minCapacity, maxCapacity, status }) => {
        let filtered = resources;
        const normalizedText = (location || '').trim().toLowerCase();
        const minCapacityValue = minCapacity === '' ? null : Number(minCapacity);
        const maxCapacityValue = maxCapacity === '' ? null : Number(maxCapacity);
        
        if (normalizedText) {
            filtered = filtered.filter(item => 
                (item.location || '').toLowerCase().includes(normalizedText) ||
                (item.name || '').toLowerCase().includes(normalizedText)
            );
        }
        if (type) {
            filtered = filtered.filter(item => item.type === type);
        }
        if (minCapacityValue !== null && !Number.isNaN(minCapacityValue)) {
            filtered = filtered.filter(item => Number(item.capacity) >= minCapacityValue);
        }
        if (maxCapacityValue !== null && !Number.isNaN(maxCapacityValue)) {
            filtered = filtered.filter(item => Number(item.capacity) <= maxCapacityValue);
        }
        if (status) {
            filtered = filtered.filter(item => item.status === status);
        }

        setFilteredResources(filtered);
    }, [resources]);

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
        <div className={`resource-list-container ${!embedded ? 'resource-theme-root' : ''}`} style={!embedded ? { padding: '40px 20px' } : {}}>
            {!embedded && <h1>Facilities & Assets Catalogue</h1>}

            {error && <div className="alert error">{error}</div>}
            {successMsg && <div className="alert success">{successMsg}</div>}

            <div className="top-bar">
                <SearchFilterBar onSearch={handleSearch} />
                {canManage && (
                    <Link to={`${basePath}/add`} className="btn btn-primary">
                        + Add New Resource
                    </Link>
                )}
            </div>

            {loading ? (
                <p>Loading basic info...</p>
            ) : (
                <ResourceTable 
                    resources={filteredResources} 
                    basePath={basePath}
                    canManage={canManage}
                    showBook={showBook}
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

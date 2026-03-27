import React, { useState } from 'react';

const ResourceForm = ({ initialData, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'LECTURE_HALL',
        capacity: '',
        location: '',
        availableFrom: '',
        availableTo: '',
        status: 'ACTIVE',
        description: '',
        ...initialData
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert capacity to integer before sending
        onSubmit({ ...formData, capacity: parseInt(formData.capacity, 10) });
    };

    return (
        <form onSubmit={handleSubmit} className="resource-form">
            <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Type:</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="LAB">Lab</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="EQUIPMENT">Equipment</option>
                </select>
            </div>

            <div className="form-group">
                <label>Capacity:</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required min="1" />
            </div>

            <div className="form-group">
                <label>Location:</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Available From:</label>
                <input type="time" name="availableFrom" value={formData.availableFrom} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Available To:</label>
                <input type="time" name="availableTo" value={formData.availableTo} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Status:</label>
                <select name="status" value={formData.status} onChange={handleChange} required>
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
            </div>

            <div className="form-group">
                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Resource'}
            </button>
        </form>
    );
};

export default ResourceForm;
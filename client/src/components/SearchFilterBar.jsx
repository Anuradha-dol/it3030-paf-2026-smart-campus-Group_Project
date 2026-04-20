import React, { useEffect, useState } from 'react';

const SearchFilterBar = ({ onSearch }) => {
    const [searchText, setSearchText] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Debounce typing so results update live without excessive rerenders.
        const timer = setTimeout(() => {
            onSearch({ text: searchText, type, status });
        }, 180);

        return () => clearTimeout(timer);
    }, [searchText, type, status, onSearch]);

    const handleSearch = () => {
        onSearch({ text: searchText, type, status });
    };

    const handleClear = () => {
        setSearchText('');
        setType('');
        setStatus('');
        onSearch({ text: '', type: '', status: '' });
    };

    return (
        <div className="search-filter-bar">
            <input 
                type="text" 
                placeholder="Search by name or location..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />
            
            <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>

            <button onClick={handleSearch} className="btn btn-search">Search</button>
            <button onClick={handleClear} className="btn btn-clear">Clear</button>
        </div>
    );
};

export default SearchFilterBar;

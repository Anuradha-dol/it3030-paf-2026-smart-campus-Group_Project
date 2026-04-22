import axios from 'axios';

// Base URL for the Spring Boot REST API
const API_URL = 'http://localhost:8085/api/resources';

export const getAllResources = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getResourceById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createResource = async (resourceData) => {
    const response = await axios.post(API_URL, resourceData);
    return response.data;
};

export const updateResource = async (id, resourceData) => {
    const response = await axios.put(`${API_URL}/${id}`, resourceData);
    return response.data;
};

export const deleteResource = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

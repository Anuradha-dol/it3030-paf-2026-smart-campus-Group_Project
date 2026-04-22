import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './OAuth2Success.css';

export default function OAuth2Success() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Processing OAuth2 login...');

    useEffect(() => {
        const handleOAuth2Success = async () => {
            try {
                // Get OAuth2 user information
                const response = await api.get('/auth/me', {
                    withCredentials: true
                });

                if (response.data.authenticated) {
                    const user = response.data.user;
                    const role = String(user.role || '').toUpperCase();

                    setMessage('Login successful! Redirecting...');

                    // Navigate based on role (same as regular login)
                    setTimeout(() => {
                        if (role.includes('ADMIN')) {
                            navigate('/dashboard', { replace: true });
                        } else {
                            navigate('/home', { replace: true });
                        }
                    }, 1000);
                } else {
                    setMessage('Authentication failed. Redirecting to login...');
                    setTimeout(() => {
                        navigate('/login', { replace: true });
                    }, 2000);
                }
            } catch (error) {
                console.error('OAuth2 success error:', error);
                setMessage('Authentication failed. Redirecting to login...');
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 2000);
            } finally {
                setLoading(false);
            }
        };

        handleOAuth2Success();
    }, [navigate]);

    return (
        <div className="oauth2-success-page">
            <div className="oauth2-success-container">
                <div className="oauth2-success-content">
                    <div className="oauth2-spinner" style={{ display: loading ? 'block' : 'none' }} />
                    <h2>{message}</h2>
                    <p>Please wait while we complete your login...</p>
                </div>
            </div>
        </div>
    );
}

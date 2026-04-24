import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Show OAuth2 error passed from backend redirect.
        const params = new URLSearchParams(location.search);
        const oauthError = params.get('oauthError');
        if (oauthError) {
            setMessage(oauthError);
            return;
        }
        setMessage('');
    }, [location.search]);

    const handleGoogleLogin = () => {
        // Start OAuth2 login on backend.
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
        window.location.href = `${apiBaseUrl}/oauth2/authorization/google?prompt=select_account`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email address';
        if (!form.password.trim()) newErrors.password = 'Password is required';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // Clear old auth cookies before fresh login.
            try {
                await api.post('/auth/logout', {}, { withCredentials: true });
            } catch {
                // Ignore if there is no active session.
            }

            const res = await api.post('/auth/login', form, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.data.success) {
                setMessage('Login successful! Redirecting...');
                const role = String(res.data.role || '').toUpperCase();

                // Route user by role after login.
                if (role.includes('ADMIN')) {
                    navigate('/dashboard', { replace: true });
                } else if (role.includes('TECHNICIAN')) {
                    navigate('/techhome', { replace: true });
                } else {
                    navigate('/home', { replace: true });
                }
            } else {
                setMessage(res.data.message || 'Login failed. Check credentials.');
            }
        } catch (err) {
            setMessage(err.response?.data?.message || 'Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='login-page'>
            <div className='login-page__canvas' />

            <div className='login-layout'>
                <section className='login-showcase' aria-hidden='true'>
                    <div className='login-showcase__photo'>
                        <div className='login-showcase__top'>
                            <strong>UniSphere Spaces</strong>
                            <div className='login-showcase__actions'>
                                <span>Sign Up</span>
                                <span className='join-pill'>Join Us</span>
                            </div>
                        </div>

                        <div className='login-showcase__bottom'>
                            <div className='login-showcase__profile'>
                                <span className='login-showcase__avatar'>U</span>
                                <div>
                                    <p>UniSphere</p>
                                    <small>Resources & Requests</small>
                                </div>
                            </div>

                            <div className='login-showcase__arrows'>
                                <span>&larr;</span>
                                <span>&rarr;</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='login-card-wrap'>
                    <div className='login-card'>
                        <div className='login-card__topbar'>
                            <strong className='login-brand'>UniSphere</strong>
                            <span className='lang-pill'>EN</span>
                        </div>

                        <div className='login-card__header'>
                            <h2>Hi UniSphere Community</h2>
                            <p>Welcome to UniSphere Resource Exchange</p>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            {message && (
                                <div className='message'>
                                    {message}
                                </div>
                            )}

                            <div className='form-group'>
                                <label>Email Address</label>
                                <input
                                    type='email'
                                    name='email'
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder='you@example.com'
                                />
                                {errors.email && <span className='error'>{errors.email}</span>}
                            </div>

                            <div className='form-group'>
                                <label>Password</label>
                                <div className='password-wrapper'>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name='password'
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder='Password'
                                    />
                                    <button
                                        type='button'
                                        className='show-btn'
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && <span className='error'>{errors.password}</span>}
                            </div>

                            <div className='login-form-meta'>
                                <Link className='forgot-link' to='/forgot-password'>
                                    Forgot password?
                                </Link>
                            </div>

                            <div className='divider'>
                                <span>or</span>
                            </div>

                            <button
                                type='button'
                                onClick={handleGoogleLogin}
                                className='google-login-btn'
                                disabled={loading}
                            >
                                <svg className='google-icon' viewBox='0 0 24 24'>
                                    <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                                    <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                                    <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
                                    <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
                                </svg>
                                Login with Google
                            </button>

                            <button type='submit' disabled={loading} className='login-btn'>
                                {loading ? 'Loading...' : 'Login'}
                            </button>
                        </form>

                        <div className='login-card__footer'>
                            <p>
                                Don't have an account? <Link to='/signup'>Sign up</Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <footer className='login-page__footer'>
                {new Date().getFullYear()} UniSphere. All rights reserved.
            </footer>
        </div>
    );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import './Signup.css';

const roleOptions = ['USER', 'ADMIN', 'TECHNICIAN'];
const yearOptions = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];
const semesterOptions = ['SEM1', 'SEM2'];

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        tempEmail: '',
        phoneNumber: '',
        role: 'USER',
        year: 'FIRST',
        semester: 'SEM1',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const phoneCheck = await api.post('/auth/check-phone', {
                phoneNumber: form.phoneNumber.trim(),
            });

            if (!phoneCheck.data?.available) {
                setError('Phone number already exists.');
                return;
            }

            const response = await api.post('/auth/register', {
                firstname: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                tempEmail: form.tempEmail.trim(),
                phoneNumber: form.phoneNumber.trim(),
                role: form.role,
                year: form.year,
                semester: form.semester,
                password: form.password,
            });

            if (!response.data?.success) {
                setError(response.data?.message || 'Signup failed.');
                return;
            }

            // Email stored in backend cookie, no need for localStorage
            setSuccess('Registration successful. Enter OTP to verify your account.');
            navigate('/verify', { state: { email: form.email.trim() } });
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='signup-page'>
            <div className='signup-page__canvas' />

            <div className='signup-layout'>
                <section className='signup-showcase' aria-hidden='true'>
                    <div className='signup-showcase__photo'>
                        <div className='signup-showcase__top'>
                            <strong>UniSphere Spaces</strong>
                            <div className='signup-showcase__actions'>
                                <span>Create Access</span>
                                <span className='join-pill'>Get Started</span>
                            </div>
                        </div>

                        <div className='signup-showcase__bottom'>
                            <div className='signup-showcase__profile'>
                                <span className='signup-showcase__avatar'>U</span>
                                <div>
                                    <p>UniSphere</p>
                                    <small>Secure Student Registration</small>
                                </div>
                            </div>

                            <div className='signup-showcase__arrows'>
                                <span>&larr;</span>
                                <span>&rarr;</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='signup-card-wrap'>
                    <div className='signup-card'>
                        <div className='signup-card__topbar'>
                            <strong className='signup-brand'>UniSphere</strong>
                            <span className='lang-pill'>EN</span>
                        </div>

                        <div className='signup-card__header'>
                            <h2>Create your account</h2>
                            <p>Register to access UniSphere resources and services</p>
                        </div>

                        <form className='signup-form' onSubmit={handleSubmit} noValidate>
                            {error && <div className='message error'>{error}</div>}
                            {success && <div className='message success'>{success}</div>}

                            <div className='signup-grid'>
                                <label className='form-group'>
                                    <span>First Name</span>
                                    <input
                                        name='firstName'
                                        value={form.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className='form-group'>
                                    <span>Last Name</span>
                                    <input
                                        name='lastName'
                                        value={form.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className='form-group'>
                                    <span>University Email</span>
                                    <input
                                        name='email'
                                        type='email'
                                        placeholder='IT23687882@my.sliit.lk'
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className='form-group'>
                                    <span>Recovery Email</span>
                                    <input
                                        name='tempEmail'
                                        type='email'
                                        placeholder='your-backup-email@example.com'
                                        value={form.tempEmail}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className='form-group'>
                                    <span>Phone Number</span>
                                    <input
                                        name='phoneNumber'
                                        placeholder='07XXXXXXXX'
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className='form-group'>
                                    <span>Role</span>
                                    <select name='role' value={form.role} onChange={handleChange}>
                                        {roleOptions.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className='form-group'>
                                    <span>Year</span>
                                    <select name='year' value={form.year} onChange={handleChange}>
                                        {yearOptions.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className='form-group'>
                                    <span>Semester</span>
                                    <select name='semester' value={form.semester} onChange={handleChange}>
                                        {semesterOptions.map((semester) => (
                                            <option key={semester} value={semester}>
                                                {semester}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className='form-group'>
                                    <span>Password</span>
                                    <input
                                        name='password'
                                        type='password'
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className='form-group'>
                                    <span>Confirm Password</span>
                                    <input
                                        name='confirmPassword'
                                        type='password'
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                            </div>

                            <button className='signup-btn' type='submit' disabled={loading}>
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div className='signup-card__footer'>
                            <p>
                                Already registered? <Link to='/login'>Go to login</Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <footer className='signup-page__footer'>
                {new Date().getFullYear()} UniSphere. All rights reserved.
            </footer>
        </div>
    );
}

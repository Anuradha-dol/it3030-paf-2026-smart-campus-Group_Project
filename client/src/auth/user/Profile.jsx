import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import './Profile.css';

const YEAR_OPTIONS = [
    { value: 'FIRST', label: 'First Year' },
    { value: 'SECOND', label: 'Second Year' },
    { value: 'THIRD', label: 'Third Year' },
    { value: 'FOURTH', label: 'Fourth Year' },
];

const SEMESTER_OPTIONS = [
    { value: 'SEM1', label: 'Semester 1' },
    { value: 'SEM2', label: 'Semester 2' },
];

function getRoleHomePath(role) {
    const normalized = String(role || '').replace('ROLE_', '').toUpperCase();

    if (normalized.includes('ADMIN')) {
        return '/dashboard';
    }

    if (normalized.includes('TECHNICIAN')) {
        return '/techome';
    }

    return '/home';
}

function buildAssetUrl(path) {
    if (!path) {
        return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `${api.defaults.baseURL}${path}`;
}

export default function Profile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const [editingField, setEditingField] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profileResponse = await api.get('/user/me');
                setProfile(profileResponse.data);
                return;
            } catch (err) {
                if (err.response?.status === 403) {
                    try {
                        const adminProfileResponse = await api.get('/user/Admin/me');
                        setProfile(adminProfileResponse.data);
                        return;
                    } catch (adminErr) {
                        const adminStatus = adminErr.response?.status;

                        if (adminStatus === 401 || adminStatus === 403) {
                            navigate('/login');
                            return;
                        }

                        setError(adminErr.response?.data?.message || 'Failed to load profile.');
                        return;
                    }
                }

                const status = err.response?.status;

                if (status === 401 || status === 403) {
                    navigate('/login');
                    return;
                }

                setError(err.response?.data?.message || 'Failed to load profile.');
            }
        };

        loadProfile();
    }, [navigate]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout', {}, { withCredentials: true });
        } catch (err) {
            console.log('Logout error:', err.message);
        } finally {
            navigate('/login', { replace: true });
        }
    };

    const firstName = profile?.name || profile?.firstname || '';
    const lastName = profile?.lastName || profile?.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const roleLabel = String(profile?.role || '').replace('ROLE_', '') || 'USER';
    const roleHomePath = getRoleHomePath(profile?.role);
    const profileImage = buildAssetUrl(profile?.profileImageUrl || profile?.imageUrl);
    const coverImage = buildAssetUrl(profile?.coverImageUrl);
    const initials = (firstName[0] || 'U').toUpperCase();
    const calendarYear = now.getFullYear();
    const calendarMonth = now.getMonth();
    const calendarLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const clockLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const calendarFirstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const calendarDaysCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const calendarCells = [
        ...Array.from({ length: calendarFirstDay }, () => null),
        ...Array.from({ length: calendarDaysCount }, (_, index) => index + 1),
    ];

    const calculateCompletionPercentage = () => {
        if (!profile) {
            return 0;
        }

        const fields = [
            firstName,
            lastName,
            profile?.email,
            profile?.phoneNumber,
            profile?.tempEmail,
            profile?.year,
            profile?.semester,
            profile?.profileImageUrl || profile?.imageUrl,
            profile?.coverImageUrl,
        ];

        const filledFields = fields.filter((field) => field && String(field).trim()).length;
        return Math.round((filledFields / fields.length) * 100);
    };

    const startEdit = (field, value) => {
        setEditingField(field);
        setEditValues((prev) => ({ ...prev, [field]: value || '' }));
    };

    const cancelEdit = () => {
        setEditingField(null);
        setEditValues({});
    };

    const updateProfileFieldWithFallback = async (field, value) => {
        const genericEndpoints = [
            '/user/update-profile-field',
            '/api/user/update-profile-field',
        ];

        for (const endpoint of genericEndpoints) {
            try {
                await api.put(endpoint, { field, value });
                return;
            } catch (err) {
                if (err.response?.status !== 404) {
                    throw err;
                }
            }
        }

        const legacyEndpointByField = {
            phoneNumber: [
                '/user/update-phone',
                '/api/user/update-phone',
                '/user/updatePhone',
                '/api/user/updatePhone',
            ],
            year: [
                '/user/update-year',
                '/api/user/update-year',
                '/user/updateYear',
                '/api/user/updateYear',
            ],
            semester: [
                '/user/update-semester',
                '/api/user/update-semester',
                '/user/updateSemester',
                '/api/user/updateSemester',
            ],
        };

        const legacyEndpoints = legacyEndpointByField[field];

        if (!legacyEndpoints) {
            throw new Error(`No update endpoint configured for ${field}`);
        }

        for (const endpoint of legacyEndpoints) {
            try {
                await api.put(endpoint, value, {
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
                return;
            } catch (err) {
                if (err.response?.status !== 404) {
                    throw err;
                }
            }
        }

        throw new Error(
            'Update endpoint not found on backend. Restart backend using run-server.cmd (JDK 17) and try again.'
        );
    };

    const saveField = async (field) => {
        const newValue = editValues[field];

        if (!newValue || !String(newValue).trim()) {
            alert('Field cannot be empty');
            return;
        }

        setSaving(true);

        try {
            if (field === 'tempEmail') {
                await api.put('/user/update-email', { newEmail: newValue.trim() });
                setProfile((prev) => ({ ...prev, tempEmail: newValue.trim() }));
            } else if (field === 'firstName') {
                const updatedFirstName = newValue.trim();
                await api.put('/user/update-name', {
                    name: updatedFirstName,
                    lastName: (editValues.lastName || lastName || '').trim(),
                });
                setProfile((prev) => ({
                    ...prev,
                    name: updatedFirstName,
                    firstname: updatedFirstName,
                }));
            } else if (field === 'lastName') {
                const updatedLastName = newValue.trim();
                await api.put('/user/update-name', {
                    name: (editValues.firstName || firstName || '').trim(),
                    lastName: updatedLastName,
                });
                setProfile((prev) => ({
                    ...prev,
                    lastName: updatedLastName,
                    lastname: updatedLastName,
                }));
            } else if (field === 'phoneNumber') {
                const updatedPhone = newValue.trim();
                await updateProfileFieldWithFallback('phoneNumber', updatedPhone);
                setProfile((prev) => ({ ...prev, phoneNumber: updatedPhone }));
            } else if (field === 'year') {
                const updatedYear = newValue.trim();
                await updateProfileFieldWithFallback('year', updatedYear);
                setProfile((prev) => ({ ...prev, year: updatedYear }));
            } else if (field === 'semester') {
                const updatedSemester = newValue.trim();
                await updateProfileFieldWithFallback('semester', updatedSemester);
                setProfile((prev) => ({ ...prev, semester: updatedSemester }));
            } else {
                alert('Cannot edit this field');
                return;
            }

            setEditingField(null);
            setEditValues({});
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update field');
        } finally {
            setSaving(false);
        }
    };

    if (!profile && !error) {
        return (
            <div className='profile-page profile-loading'>
                <div className='spinner' />
                <p>Loading profile...</p>
            </div>
        );
    }

    const completionPercentage = calculateCompletionPercentage();

    const detailsRows = [
        { label: 'First Name', value: firstName, field: 'firstName', isMissing: !firstName },
        { label: 'Last Name', value: lastName, field: 'lastName', isMissing: !lastName },
        { label: 'Email', value: profile?.email, field: 'email', isMissing: !profile?.email },
        { label: 'Recovery Email', value: profile?.tempEmail, field: 'tempEmail', isMissing: !profile?.tempEmail },
        { label: 'Phone', value: profile?.phoneNumber, field: 'phoneNumber', isMissing: !profile?.phoneNumber },
        { label: 'Year', value: profile?.year, field: 'year', isMissing: !profile?.year },
        { label: 'Semester', value: profile?.semester, field: 'semester', isMissing: !profile?.semester },
        { label: 'Role', value: roleLabel, field: 'role', isMissing: false },
    ];

    return (
        <div className='profile-page'>
            <div className='profile-page__canvas' />

            <div className='profile-workbench'>
                <aside className='profile-sidebar'>
                    <div className='sidebar-brand'>
                        <span className='brand-avatar'>
                            {profileImage ? <img src={profileImage} alt='Profile avatar' /> : initials}
                        </span>
                        <div className='brand-info'>
                            <strong>{fullName || 'User'}</strong>
                            <small>{profile?.email || 'No email'}</small>
                        </div>
                    </div>

                    <nav className='sidebar-nav'>
                        <p className='sidebar-label'>Quick Navigation</p>
                        <Link className='sidebar-link' to={roleHomePath}>
                            Home
                        </Link>
                        <Link className='sidebar-link active' to='/profile'>
                            Profile
                        </Link>
                        <Link className='sidebar-link' to='/settings'>
                            Settings
                        </Link>
                    </nav>

                    <div className='sidebar-card'>
                        <p className='sidebar-label'>Profile Status</p>
                        <div className='sidebar-item'>
                            <span>Completion</span>
                            <strong>{completionPercentage}%</strong>
                        </div>
                        <div className='sidebar-item'>
                            <span>Role</span>
                            <strong>{roleLabel}</strong>
                        </div>
                        <div className='sidebar-item'>
                            <span>Recovery</span>
                            <strong>{profile?.tempEmail ? 'Added' : 'Missing'}</strong>
                        </div>
                    </div>

                    <div className='sidebar-calendar-card'>
                        <p className='sidebar-label'>Calendar</p>
                        <div className='sidebar-calendar-header'>
                            <strong>{calendarLabel}</strong>
                            <span className='sidebar-today-badge'>Today {now.getDate()}</span>
                        </div>
                        <div className='sidebar-clock'>{clockLabel}</div>
                        <div className='sidebar-calendar-grid'>
                            <div className='sidebar-calendar-weekdays'>
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                    <span key={day} className='weekday'>{day}</span>
                                ))}
                            </div>
                            <div className='sidebar-calendar-days'>
                                {calendarCells.map((day, index) => (
                                    <span
                                        key={`day-${index}`}
                                        className={`day${day === null ? ' empty' : ''}${day === now.getDate() ? ' today' : ''}`}
                                        aria-hidden={day === null}
                                    >
                                        {day ?? ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className='profile-main'>
                    <header className='profile-header'>
                        <div>
                            <h1>Profile</h1>
                            <p>Manage your personal details and completion progress.</p>
                        </div>
                        <div className='profile-header__actions'>
                            <button className='btn btn-danger' type='button' onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </header>

                    {error && <p className='message error'>{error}</p>}

                    {!error && (
                        <div className='profile-grid'>
                            <article className='card hero-card'>
                                <div className='hero-cover'>
                                    {coverImage ? <img src={coverImage} alt='Cover' /> : <div className='cover-fallback' />}
                                </div>
                                <div className='hero-body'>
                                    <div className='hero-avatar'>
                                        {profileImage ? <img src={profileImage} alt='Profile' /> : <span>{initials}</span>}
                                    </div>
                                    <div className='hero-text'>
                                        <h2>{fullName || 'User'}</h2>
                                        <p>{profile?.email || '-'}</p>
                                        <span className='role-chip'>{roleLabel}</span>
                                    </div>
                                </div>
                            </article>

                            <article className='card completion-card'>
                                <div className='completion-header'>
                                    <h3>Profile Completion</h3>
                                    <strong>{completionPercentage}%</strong>
                                </div>
                                <div className='completion-bar'>
                                    <span style={{ width: `${completionPercentage}%` }} />
                                </div>
                                <p className='completion-text'>
                                    {completionPercentage === 100
                                        ? 'Profile complete'
                                        : `${100 - completionPercentage}% remaining to complete`}
                                </p>
                            </article>

                            <article className='card details-card'>
                                <h3>Editable Profile Details</h3>
                                <div className='details-list'>
                                    {detailsRows.map((row) => (
                                        <div key={row.field} className={`details-row${row.isMissing ? ' missing' : ''}`}>
                                            <div className='row-head'>
                                                <span>{row.label}</span>
                                                {row.isMissing && <small>Missing</small>}
                                            </div>

                                            {editingField === row.field ? (
                                                <div className='edit-row'>
                                                    {row.field === 'year' ? (
                                                        <select
                                                            value={editValues[row.field] || ''}
                                                            onChange={(event) =>
                                                                setEditValues((prev) => ({
                                                                    ...prev,
                                                                    [row.field]: event.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value=''>Select year</option>
                                                            {YEAR_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : row.field === 'semester' ? (
                                                        <select
                                                            value={editValues[row.field] || ''}
                                                            onChange={(event) =>
                                                                setEditValues((prev) => ({
                                                                    ...prev,
                                                                    [row.field]: event.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value=''>Select semester</option>
                                                            {SEMESTER_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type={row.field === 'tempEmail' ? 'email' : 'text'}
                                                            value={editValues[row.field] || ''}
                                                            onChange={(event) =>
                                                                setEditValues((prev) => ({
                                                                    ...prev,
                                                                    [row.field]: event.target.value,
                                                                }))
                                                            }
                                                            placeholder={`Enter ${row.label.toLowerCase()}`}
                                                        />
                                                    )}
                                                    <button
                                                        className='btn btn-primary'
                                                        type='button'
                                                        onClick={() => saveField(row.field)}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        className='btn btn-soft'
                                                        type='button'
                                                        onClick={cancelEdit}
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='view-row'>
                                                    <strong>{row.value || '-'}</strong>
                                                    {row.field !== 'email' && row.field !== 'role' && (
                                                        <button
                                                            className='edit-link'
                                                            type='button'
                                                            onClick={() => startEdit(row.field, row.value)}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className='card status-card'>
                                <h3>Account Status</h3>
                                <div className='status-grid'>
                                    <div className='status-item'>
                                        <span>Phone Linked</span>
                                        <strong>{profile?.phoneNumber ? 'Yes' : 'No'}</strong>
                                    </div>
                                    <div className='status-item'>
                                        <span>Recovery Email</span>
                                        <strong>{profile?.tempEmail ? 'Added' : 'Missing'}</strong>
                                    </div>
                                    <div className='status-item'>
                                        <span>Academic Year</span>
                                        <strong>{profile?.year || 'Missing'}</strong>
                                    </div>
                                    <div className='status-item'>
                                        <span>Semester</span>
                                        <strong>{profile?.semester || 'Missing'}</strong>
                                    </div>
                                </div>
                            </article>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

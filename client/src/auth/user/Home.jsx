import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import "./Dashboard.css"; // Reuse the advanced Dashboard styling
import "./Profile.css";
import RoleNavbar from "../../comp/RoleNavbar";
import ResourceListPage from "../../pages/ResourceListPage";

function buildAssetUrl(path) {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${api.defaults.baseURL}${path}`;
}

export default function Home() {
    const navigate = useNavigate();

    const [homeData, setHomeData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dashboardResponse, profileResponse] = await Promise.all([
                    api.get("/user/Admin/dashboard"),
                    api.get("/user/Admin/me"),
                ]);

                setHomeData(dashboardResponse.data);
                setProfile(profileResponse.data);
                return;
            } catch (adminErr) {
                if (adminErr.response?.status !== 401 && adminErr.response?.status !== 403) {
                    console.error(adminErr);
                }
            }

            try {
                const [homeResponse, profileResponse] = await Promise.all([
                    api.get("/user/home"),
                    api.get("/user/me"),
                ]);

                setHomeData(homeResponse.data);
                setProfile(profileResponse.data);
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate("/login");
                    return;
                }

                setError(err.response?.data?.message || "Failed to load home page.");
            }
        };

        loadData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (err) {
            console.log("Logout error:", err.message);
        } finally {
            navigate("/login", { replace: true });
        }
    };

    if (!homeData && !error) {
        return (
            <div className="md-screen loading">
                <div className="md-spinner" />
                <p>Loading Home...</p>
            </div>
        );
    }

    const roleLabel = String(profile?.role || "").replace("ROLE_", "") || "USER";
    const isAdmin = String(profile?.role || "").toUpperCase().includes("ADMIN");
    const homePath = isAdmin ? "/dashboard" : "/home";
    const firstName = profile?.name || profile?.firstname || "";
    const lastName = profile?.lastName || profile?.lastname || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = (firstName[0] || "U").toUpperCase();
    const profileImage = buildAssetUrl(profile?.profileImageUrl || profile?.imageUrl);
    const currentDay = time.getDate();
    const calendarLabel = time.toLocaleString("default", { month: "long", year: "numeric" });
    const clockLabel = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const calendarYear = time.getFullYear();
    const calendarMonth = time.getMonth();
    const calendarFirstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const calendarDaysCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const calendarCells = [
        ...Array.from({ length: calendarFirstDay }, () => null),
        ...Array.from({ length: calendarDaysCount }, (_, index) => index + 1),
    ];
    const completionFields = [
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
    const filledFieldsCount = completionFields.filter((field) => field && String(field).trim()).length;
    const completionPercentage = Math.round((filledFieldsCount / completionFields.length) * 100);

    return (
        <div className="md-screen">
            <div className="md-layout">
                <aside className="md-sidebar profile-sidebar">
                    <div className="sidebar-brand">
                        <span className="brand-avatar">
                            {profileImage ? <img src={profileImage} alt="Profile avatar" /> : initials}
                        </span>
                        <div className="brand-info">
                            <strong>{fullName || "User"}</strong>
                            <small>{profile?.email || "No email"}</small>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <p className="sidebar-label">Quick Navigation</p>
                        <Link className="sidebar-link active" to={homePath}>
                            Home
                        </Link>
                        <Link className="sidebar-link" to="/profile">
                            Profile
                        </Link>
                        <Link className="sidebar-link" to="/settings">
                            Settings
                        </Link>
                    </nav>

                    <div className="sidebar-card">
                        <p className="sidebar-label">Profile Status</p>
                        <div className="sidebar-item">
                            <span>Completion</span>
                            <strong>{completionPercentage}%</strong>
                        </div>
                        <div className="sidebar-item">
                            <span>Role</span>
                            <strong>{roleLabel}</strong>
                        </div>
                        <div className="sidebar-item">
                            <span>Recovery</span>
                            <strong>{profile?.tempEmail ? "Added" : "Missing"}</strong>
                        </div>
                    </div>

                    <div className="sidebar-calendar-card">
                        <p className="sidebar-label">Calendar</p>
                        <div className="sidebar-calendar-header">
                            <strong>{calendarLabel}</strong>
                            <span className="sidebar-today-badge">Today {currentDay}</span>
                        </div>
                        <div className="sidebar-clock">{clockLabel}</div>
                        <div className="sidebar-calendar-grid">
                            <div className="sidebar-calendar-weekdays">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                    <span key={day} className="weekday">{day}</span>
                                ))}
                            </div>
                            <div className="sidebar-calendar-days">
                                {calendarCells.map((day, index) => (
                                    <span
                                        key={`day-${index}`}
                                        className={`day${day === null ? " empty" : ""}${day === currentDay ? " today" : ""}`}
                                        aria-hidden={day === null}
                                    >
                                        {day ?? ""}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* --- Main Home Content --- */}
                <main className="md-main">
                    <header className="md-topbar">
                        <div className="md-topbar-left">
                            <h1 className="md-title">User Dashboard</h1>
                            <p className="md-subtitle">{homeData?.welcomeMessage || "Welcome back to your portal."}</p>
                            
                            <div className="md-header-actions">
                                <Link className="md-btn md-btn-outline md-btn-sm" to="/profile">Manage Profile</Link>
                                <Link className="md-btn md-btn-outline md-btn-sm" to="/settings">User Settings</Link>
                                {isAdmin && (
                                    <Link className="md-btn md-btn-outline md-btn-sm" to="/dashboard" style={{ borderColor: '#d96a32', color: '#d96a32' }}>Open Admin Panel</Link>
                                )}
                            </div>
                        </div>
                        <div className="md-topbar-actions">
                            <RoleNavbar role={profile?.role} />
                            <button className="md-btn-logout" onClick={handleLogout}>Logout</button>
                        </div>
                    </header>

                    {error && <div className="md-alert error">{error}</div>}

                    {!error && (
                        <div className="md-content-scroll">
                            {/* Resources Panel takes full clean layout footprint */}
                            <div className="md-panel md-resource-wrapper">
                                <div className="md-panel-header" style={{ display: 'none' }}>
                                    <h2>Resources</h2>
                                </div>
                                <div className="md-panel-body p-0">
                                    <ResourceListPage 
                                        embedded 
                                        basePath="/dashboard/resources" 
                                        canManage={isAdmin} 
                                        showBook={!isAdmin} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

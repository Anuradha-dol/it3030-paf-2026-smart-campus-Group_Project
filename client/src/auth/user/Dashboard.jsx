import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import "./Dashboard.css";
import RoleNavbar from "../../comp/RoleNavbar";
import ResourceListPage from "../../pages/ResourceListPage";

export default function Dashboard() {
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
        const loadDashboard = async () => {
            try {
                const [dashboardResponse, profileResponse] = await Promise.all([
                    api.get("/user/Admin/dashboard"),
                    api.get("/user/Admin/me"),
                ]);

                setHomeData(dashboardResponse.data);
                setProfile(profileResponse.data);
            } catch (adminErr) {
                if (adminErr.response?.status === 401) {
                    navigate("/login");
                    return;
                }

                try {
                    const [homeResponse, profileResponse] = await Promise.all([
                        api.get("/user/home"),
                        api.get("/user/me"),
                    ]);

                    setHomeData(homeResponse.data);
                    setProfile(profileResponse.data);
                } catch (fallbackErr) {
                    if (fallbackErr.response?.status === 401 || fallbackErr.response?.status === 403) {
                        navigate("/login");
                        return;
                    }
                    setError(fallbackErr.response?.data?.message || "Failed to load dashboard.");
                }
            }
        };

        loadDashboard();
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
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    const roleLabel = String(profile?.role || "").replace("ROLE_", "") || "USER";
    const isAdmin = String(profile?.role || "").toUpperCase().includes("ADMIN");

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[time.getMonth()];
    const currentYear = time.getFullYear();
    const currentDay = time.getDate();
    
    // Build calendar mock grid
    const daysInMonth = new Date(currentYear, time.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, time.getMonth(), 1).getDay();
    const calCells = Array.from({ length: 42 });

    return (
        <div className="md-screen">
            <div className="md-layout">
                {/* --- Left Floating Sidebar --- */}
                <aside className="md-sidebar">
                    {/* User Mini Profile (Optional but good for context) */}
                    <div className="md-sidebar-profile">
                        <div className="md-avatar">
                            {profile?.name ? profile.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="md-user-info">
                            <h5>{profile?.name || "User"} {profile?.lastName || ""}</h5>
                            <span>{profile?.email || "user@example.com"}</span>
                        </div>
                    </div>

                    <div className="md-nav-group">
                        <p className="md-nav-label">QUICK NAVIGATION</p>
                        <nav className="md-nav">
                            <Link to="/home" className="md-nav-item">Home</Link>
                            <Link to="/profile" className="md-nav-item">Profile</Link>
                            <Link to="/settings" className="md-nav-item">Settings</Link>
                        </nav>
                    </div>

                    <div className="md-nav-group">
                        <p className="md-nav-label">PROFILE STATUS</p>
                        <div className="md-status-grid">
                            <span>Completion</span> <strong>44%</strong>
                            <span>Role</span> <strong>{roleLabel}</strong>
                            <span>Recovery</span> <strong className="md-status-missing">Missing</strong>
                        </div>
                    </div>

                    <div className="md-nav-group">
                        <p className="md-nav-label">DASHBOARD STATS</p>
                        <div className="md-sidebar-stats">
                            <div className="md-stat-card-slim">
                                <div className="md-stat-icon-slim">🔔</div>
                                <div className="details">
                                    <p>Notifications</p>
                                    <h3>{homeData?.notifications ?? 0}</h3>
                                </div>
                            </div>
                            <div className="md-stat-card-slim">
                                <div className="md-stat-icon-slim">📋</div>
                                <div className="details">
                                    <p>Tasks</p>
                                    <h3>{homeData?.tasks ?? 0}</h3>
                                </div>
                            </div>
                            <div className="md-stat-card-slim">
                                <div className="md-stat-icon-slim">{isAdmin ? '🛡️' : '👤'}</div>
                                <div className="details">
                                    <p>Current Role</p>
                                    <h3>{roleLabel}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md-nav-group md-calendar-widget">
                        <p className="md-nav-label">CALENDAR</p>
                        <div className="md-cal-header">
                            <strong>{currentMonth} {currentYear}</strong>
                            <span className="md-today-badge">Today {currentDay}</span>
                        </div>
                        <p className="md-cal-time">{time.toLocaleTimeString()}</p>
                        <div className="md-cal-grid">
                            <div className="cal-day-label">Su</div>
                            <div className="cal-day-label">Mo</div>
                            <div className="cal-day-label">Tu</div>
                            <div className="cal-day-label">We</div>
                            <div className="cal-day-label">Th</div>
                            <div className="cal-day-label">Fr</div>
                            <div className="cal-day-label">Sa</div>
                            {calCells.map((_, i) => {
                                const dayNum = i - firstDayIndex + 1;
                                const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                                const isToday = isCurrentMonth && dayNum === currentDay;
                                return (
                                    <div key={i} className={`cal-cell ${isToday ? 'active' : ''} ${!isCurrentMonth ? 'dim' : ''}`}>
                                        {dayNum > 0 && dayNum <= daysInMonth ? dayNum : (dayNum <= 0 ? 30+dayNum : dayNum-daysInMonth)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* --- Main Dashboard Content --- */}
                <main className="md-main">
                    <header className="md-topbar">
                        <div className="md-topbar-left">
                            <h1 className="md-title">Admin Dashboard</h1>
                            <p className="md-subtitle">{homeData?.welcomeMessage || "Welcome back to your administration portal."}</p>
                            
                            <div className="md-header-actions">
                                <Link className="md-btn md-btn-outline md-btn-sm" to="/profile">Manage Profile</Link>
                                <Link className="md-btn md-btn-outline md-btn-sm" to="/settings">Admin Settings</Link>
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
                            {/* Resources Panel perfectly fills layout */}
                            <div className="md-panel md-resource-wrapper">
                                <div className="md-panel-header" style={{ display: 'none' }}>
                                    <h2>Manage Resources</h2>
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

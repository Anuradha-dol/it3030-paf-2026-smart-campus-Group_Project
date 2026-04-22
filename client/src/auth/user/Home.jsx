import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import RoleNavbar from "../../comp/RoleNavbar";
import ResourceListPage from "../../pages/ResourceListPage";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();

    const [homeData, setHomeData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [homeResponse, profileResponse] = await Promise.all([
                    api.get("/user/home"),
                    api.get("/user/me"),
                ]);

                setHomeData(homeResponse.data);
                setProfile(profileResponse.data);
            } catch (err) {
                const status = err.response?.status;

                if (status === 401 || status === 403) {
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
            // Call logout endpoint to clear cookies on backend
            await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (err) {
            console.log("Logout error:", err.message);
        } finally {
            // Redirect to login regardless of API result
            navigate("/login", { replace: true });
        }
    };

    if (!homeData && !error) {
        return (
            <div className="home-screen loading-center">
                <div className="spinner" />
                <p>Loading home...</p>
            </div>
        );
    }

    const role = String(profile?.role || "").replace("ROLE_", "");
    const isAdmin = role.toUpperCase().includes("ADMIN");

    return (
        <div className="home-screen page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Uni Learn Hub</h1>
                        <p className="subtitle">{homeData?.welcomeMessage || "Welcome back."}</p>
                    </div>

                    <div className="nav-group">
                        <RoleNavbar role={profile?.role} />
                        <button className="btn btn-danger" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <>
                        <div className="stats">
                            <article className="stat-card">
                                <h3>Notifications</h3>
                                <p className="value">{homeData?.notifications ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Tasks</h3>
                                <p className="value">{homeData?.tasks ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Role</h3>
                                <p className="value">{role || "USER"}</p>
                            </article>
                        </div>

                        <section className="section">
                            <h3>Quick Actions</h3>
                            <div className="actions-row">
                                <Link className="btn btn-secondary" to="/profile">View Profile</Link>
                                <Link className="btn btn-secondary" to="/settings">Manage Settings</Link>
                                {isAdmin && (
                                    <Link className="btn btn-secondary" to="/dashboard">Open Dashboard</Link>
                                )}
                            </div>
                        </section>

                        <section className="section">
                            <h3>Resources</h3>
                            <ResourceListPage
                                embedded
                                basePath="/dashboard/resources"
                                canManage={isAdmin}
                                showBook={!isAdmin}
                            />
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

import { Link, useLocation } from "react-router-dom";

function normalizeRole(role) {
    return String(role || "").replace("ROLE_", "").toUpperCase();
}

function getHomePath(role) {
    const normalized = normalizeRole(role);

    if (normalized.includes("ADMIN")) {
        return "/dashboard";
    }

    if (normalized.includes("TECHNICIAN")) {
        return "/techome";
    }

    return "/home";
}

function getLinkClass(baseClass, isActive) {
    return isActive ? `${baseClass} active` : baseClass;
}

export default function RoleNavbar({ role }) {
    const location = useLocation();
    const homePath = getHomePath(role);

    const homeActive = location.pathname === homePath;
    const profileActive = location.pathname === "/profile";
    const settingsActive = location.pathname === "/settings";

    return (
        <>
            <Link className={getLinkClass("nav-link", homeActive)} to={homePath}>
                Home
            </Link>
            <Link className={getLinkClass("nav-link", profileActive)} to="/profile">
                Profile
            </Link>
            <Link className={getLinkClass("nav-link", settingsActive)} to="/settings">
                Settings
            </Link>
        </>
    );
}

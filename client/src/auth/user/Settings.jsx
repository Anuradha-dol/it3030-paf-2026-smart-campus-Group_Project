import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

function buildAssetUrl(path) {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${api.defaults.baseURL}${path}`;
}

const toast = {
    success: (message) => {
        if (message) {
            console.log(message);
        }
    },
    error: (message) => {
        const text = typeof message === "string" ? message : "Operation failed.";
        console.error(text);
        window.alert(text);
    },
};

export default function Settings() {
    const navigate = useNavigate();

    const [initialLoading, setInitialLoading] = useState(true);
    const [working, setWorking] = useState(false);

    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        profileImageUrl: "",
        coverImageUrl: "",
    });

    const [nameForm, setNameForm] = useState({ firstName: "", lastName: "" });
    const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [profileFile, setProfileFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    const loadProfile = async () => {
        try {
            let response;

            try {
                response = await api.get("/user/me");
            } catch (err) {
                if (err.response?.status === 403) {
                    response = await api.get("/user/Admin/me");
                } else {
                    throw err;
                }
            }

            const data = response.data;
            const firstName = data.name || data.firstname || "";
            const lastName = data.lastName || "";

            setUser({
                firstName,
                lastName,
                email: data.email || "",
                role: String(data.role || "").replace("ROLE_", ""),
                profileImageUrl: data.profileImageUrl || "",
                coverImageUrl: data.coverImageUrl || "",
            });

            setNameForm({
                firstName,
                lastName,
            });
        } catch (err) {
            const status = err.response?.status;
            if (status === 401 || status === 403) {
                navigate("/login");
                return;
            }

            toast.error(err.response?.data?.message || "Failed to load settings.");
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const updateName = async () => {
        if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) {
            toast.error("First name and last name are required.");
            return;
        }

        setWorking(true);
        try {
            await api.put("/user/update-name", {
                name: nameForm.firstName.trim(),
                lastName: nameForm.lastName.trim(),
            });

            toast.success("Name updated successfully.");
            setUser((prev) => ({
                ...prev,
                firstName: nameForm.firstName.trim(),
                lastName: nameForm.lastName.trim(),
            }));
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || "Failed to update name.");
        } finally {
            setWorking(false);
        }
    };

    const requestEmailChange = async () => {
        if (!emailForm.newEmail.trim()) {
            toast.error("New email is required.");
            return;
        }

        setWorking(true);
        try {
            const response = await api.put("/user/update-email", {
                newEmail: emailForm.newEmail.trim(),
            });
            toast.success(response.data || "OTP sent to your new email.");
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || "Failed to send OTP.");
        } finally {
            setWorking(false);
        }
    };

    const verifyEmailChange = async () => {
        if (!emailForm.otp.trim()) {
            toast.error("OTP is required.");
            return;
        }

        setWorking(true);
        try {
            const response = await api.post("/user/verify-new-email", null, {
                params: { otp: emailForm.otp.trim() },
            });

            toast.success(response.data || "Email updated. Please login again.");

            // Call logout to clear cookies
            try {
                await api.post("/auth/logout", {}, { withCredentials: true });
            } catch (err) {
                console.log("Logout error:", err.message);
            }
            navigate("/login", { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || "Failed to verify OTP.");
        } finally {
            setWorking(false);
        }
    };

    const updatePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error("All password fields are required.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New password and confirm password must match.");
            return;
        }

        setWorking(true);
        try {
            const response = await api.put("/user/update-password", passwordForm);
            toast.success(response.data || "Password updated successfully.");
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || "Failed to update password.");
        } finally {
            setWorking(false);
        }
    };

    const deleteAccount = async () => {
        setWorking(true);
        try {
            const response = await api.delete("/user/delete");

            toast.success(response.data || "Account deleted.");

            navigate("/login", { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || "Failed to delete account.");
        } finally {
            setWorking(false);
        }
    };

    const uploadImage = async (type) => {
        const file = type === "profile" ? profileFile : coverFile;

        if (!file) {
            toast.error("Choose an image first.");
            return;
        }

        setWorking(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const endpoint =
                type === "profile" ? "/user/upload-profile-image" : "/user/upload-cover-image";

            const response = await api.post(endpoint, formData);
            const imagePath = typeof response.data === "string" ? response.data : "";

            if (type === "profile") {
                setUser((prev) => ({ ...prev, profileImageUrl: imagePath }));
                setProfileFile(null);
            } else {
                setUser((prev) => ({ ...prev, coverImageUrl: imagePath }));
                setCoverFile(null);
            }

            toast.success("Image uploaded successfully.");
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || "Image upload failed.");
        } finally {
            setWorking(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Settings</h1>
                        <p className="subtitle">Manage profile, credentials, and account security.</p>
                    </div>
                    <div className="nav-group">
                        <Link className="nav-link" to="/home">Home</Link>
                        <Link className="nav-link" to="/dashboard">Dashboard</Link>
                        <Link className="nav-link" to="/profile">Profile</Link>
                    </div>
                </header>

                <section className="settings-grid">
                    <article className="section">
                        <h3>Basic Profile</h3>
                        <p className="muted">Role: {user.role || "USER"}</p>
                        <div className="form-grid">
                            <label className="field">
                                <span>First Name</span>
                                <input
                                    value={nameForm.firstName}
                                    onChange={(event) =>
                                        setNameForm((prev) => ({ ...prev, firstName: event.target.value }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>Last Name</span>
                                <input
                                    value={nameForm.lastName}
                                    onChange={(event) =>
                                        setNameForm((prev) => ({ ...prev, lastName: event.target.value }))
                                    }
                                />
                            </label>
                            <button className="btn btn-primary" type="button" onClick={updateName} disabled={working}>
                                Save Name
                            </button>
                        </div>
                    </article>

                    <article className="section">
                        <h3>Email Update</h3>
                        <p className="muted">Current email: {user.email}</p>
                        <div className="form-grid">
                            <label className="field">
                                <span>New Email</span>
                                <input
                                    type="email"
                                    value={emailForm.newEmail}
                                    onChange={(event) =>
                                        setEmailForm((prev) => ({ ...prev, newEmail: event.target.value }))
                                    }
                                />
                            </label>
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={requestEmailChange}
                                disabled={working}
                            >
                                Send OTP
                            </button>
                            <label className="field">
                                <span>Email OTP</span>
                                <input
                                    value={emailForm.otp}
                                    onChange={(event) =>
                                        setEmailForm((prev) => ({ ...prev, otp: event.target.value }))
                                    }
                                />
                            </label>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={verifyEmailChange}
                                disabled={working}
                            >
                                Verify New Email
                            </button>
                        </div>
                    </article>

                    <article className="section">
                        <h3>Password</h3>
                        <div className="form-grid">
                            <label className="field">
                                <span>Current Password</span>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(event) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            currentPassword: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>New Password</span>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            newPassword: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>Confirm Password</span>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            confirmPassword: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={updatePassword}
                                disabled={working}
                            >
                                Update Password
                            </button>
                        </div>
                    </article>

                    <article className="section">
                        <h3>Profile Images</h3>
                        <div className="upload-grid">
                            <div className="upload-card">
                                <div className="image-preview">
                                    {user.profileImageUrl ? (
                                        <img src={buildAssetUrl(user.profileImageUrl)} alt="Profile preview" />
                                    ) : (
                                        <span>No profile image</span>
                                    )}
                                </div>
                                <input
                                    className="file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => setProfileFile(event.target.files?.[0] || null)}
                                />
                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => uploadImage("profile")}
                                    disabled={working}
                                >
                                    Upload Profile Image
                                </button>
                            </div>

                            <div className="upload-card">
                                <div className="image-preview cover">
                                    {user.coverImageUrl ? (
                                        <img src={buildAssetUrl(user.coverImageUrl)} alt="Cover preview" />
                                    ) : (
                                        <span>No cover image</span>
                                    )}
                                </div>
                                <input
                                    className="file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
                                />
                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => uploadImage("cover")}
                                    disabled={working}
                                >
                                    Upload Cover Image
                                </button>
                            </div>
                        </div>
                    </article>

                    <article className="section danger-zone">
                        <h3>Delete Account</h3>
                        <p className="muted">This action cannot be undone.</p>
                        <div className="form-grid">
                            <button className="btn btn-danger" type="button" onClick={deleteAccount} disabled={working}>
                                Delete Account
                            </button>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}

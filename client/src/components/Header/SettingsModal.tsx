import React, { useState } from "react";
import "./LoginModal.css";
import { useUser } from "../../context/UserContext";
import toast from "react-hot-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout }) => {
  const { user, setUser } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  if (!isOpen) return null;

  // Uppdatera konto
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!oldPassword) {
      setError("Current password required.");
      return;
    }
    try {
      const token = user?.token;
      const res = await fetch("http://localhost:3500/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          oldPassword,
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account updated!");
        setUser({ ...user!, firstName, lastName, email });
        setOldPassword("");
        setNewPassword("");
        onClose();
      } else {
        setError(data.message || "Update failed");
      }
    } catch {
      setError("Network error");
    }
  };

  // Ta bort konto
  const handleDelete = async () => {
    setDeleteError("");
    try {
      const token = user?.token;
      const res = await fetch("http://localhost:3500/api/user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        toast.success("Account deleted.");
        setUser(null);
        onLogout();
        onClose();
      } else {
        const data = await res.json();
        setDeleteError(data.message || "Delete failed");
      }
    } catch {
      setDeleteError("Network error");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Account Settings</h2>
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>First Name:</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" />
          </div>
          <div className="form-group">
            <label>Current password:</label>
            <input value={oldPassword} onChange={e => setOldPassword(e.target.value)} type="password" required />
          </div>
          <div className="form-group">
            <label>New password (optional):</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="primary-btn">Update</button>
        </form>
        
        <button
          className="secondary-btn"
          style={{ background: "#e63946", color: "#fff", marginTop: 10 }}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete account
        </button>
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Account</h3>
              <p style={{ marginBottom: 12 }}>
                Enter your password to confirm <b>deletion of your account</b>:
              </p>
              <div className="form-group">
                
                <input
                  className="modal-input"
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              {deleteError && <div className="error-text">{deleteError}</div>}
              <button className="primary-btn" onClick={handleDelete}>Delete</button>
              <button className="secondary-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        )}
        <button className="secondary-btn" onClick={onClose} style={{ marginTop: 10 }}>Cancel</button>
      </div>
    </div>
  );
};

export default SettingsModal;
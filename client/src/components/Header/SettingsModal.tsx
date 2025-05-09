import React, { useState } from "react";
import "./LoginModal.css";
import { useUser } from "../../context/UserContext";
import toast from "react-hot-toast";

// Define the Stream type
interface Stream {
  label: string;
  url: string;
}

const defaultStreams = [
  { label: "Angle 1", url: "/videos/angle1.mp4" },
  { label: "Angle 2", url: "/videos/angle2.mp4" },
  { label: "Angle 3", url: "/videos/angle3.mp4" },
  { label: "Angle 4", url: "/videos/angle4.mp4" }
];

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [streams, setStreams] = useState(() => {
    const stored = localStorage.getItem("customStreams");
    return stored ? JSON.parse(stored) : defaultStreams;
  });

  if (!isOpen) return null;

  // Uppdatera konto
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Current password required.");
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
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Ta bort konto
  const handleDelete = async () => {
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
        toast.error(data.message || "Delete failed"); // Visa toast istället för röd text
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Spara till localStorage när streams ändras
  const handleStreamChange = (idx: number, url: string) => {
    const updated = streams.map((s: Stream, i: number): Stream => i === idx ? { ...s, url } : s);
    setStreams(updated);
    localStorage.setItem("customStreams", JSON.stringify(updated));
    window.dispatchEvent(new Event("customStreamsChanged")); // <-- Lägg till denna rad
  };

  const handleResetStreams = () => {
    setStreams(defaultStreams);
    localStorage.removeItem("customStreams");
    window.dispatchEvent(new Event("customStreamsChanged")); // <-- Lägg till denna rad
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Account Settings</h2>

        {/* Stream URL settings */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: "1.1em", marginBottom: 8 }}>Custom stream URLs</h3>
          {streams.map((stream: { label: string; url: string }, idx: number) => (
            <div className="form-group" key={stream.label}>
              <label>{stream.label} URL:</label>
              <input
                className="modal-input"
                type="text"
                value={stream.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStreamChange(idx, e.target.value)}
                placeholder={`URL for ${stream.label}`}
              />
            </div>
          ))}
          <button
            type="button"
            className="secondary-btn"
            style={{ marginTop: 4 }}
            onClick={handleResetStreams}
          >
            Reset to default
          </button>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>First Name:</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)}  />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)}  />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input value={email} onChange={e => setEmail(e.target.value)}  type="email" />
          </div>
          <div className="form-group">
            <label>Current password (required):</label>
            <input value={oldPassword} onChange={e => setOldPassword(e.target.value)} type="password"  />
          </div>
          <div className="form-group">
            <label>New password (optional):</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" />
          </div>
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
                <label>Password:</label>
                <input
                  className="modal-input"
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              
              <button className="delete-btn popup" onClick={handleDelete}>Delete</button>
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        )}
        <button className="cancel-btn" onClick={onClose} style={{ marginTop: 10 }}>Cancel</button>
      </div>
    </div>
  );
};

export default SettingsModal;
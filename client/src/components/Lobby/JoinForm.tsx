import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css";
import toast from 'react-hot-toast';

interface JoinFormProps {
  userId: string;
  onJoinSuccess: (roomName: string, password?: string) => void;
}

const TAG_OPTIONS = [
  "First Timer",
  "Pro",
  "Please Be Quiet",
  "Open Discussion",
  "Strangers Welcome"
];

const JoinForm: React.FC<JoinFormProps> = ({ userId, onJoinSuccess }) => {
  const [error, setError] = useState("");
  const socket = useSocket();
  const [maxUsers, setMaxUsers] = useState<number>(6);
  const [password, setPassword] = useState("");
  const [connected, setConnected] = useState(socket.connected);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => setAnimateOpen(true), 10);
  };

  const closeForm = () => {
    setAnimateOpen(false);
    setTimeout(() => setShowForm(false), 400); // matcha transition-tiden
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;

    // userId kommer från props, men säkerställ att det finns
    if (!userId) {
      toast.error("You must be logged in!");
      return;
    }

    const payload: any = { userId, maxUsers, tags: selectedTags };
    if (password && password.length > 0) payload.password = password;

    socket.emit("requestRoom", payload, (response: { success: boolean; roomName?: string }) => {
      if (response.success && response.roomName) {
        localStorage.setItem("chatRoom", response.roomName);
        if (password && password.length > 0) {
          localStorage.setItem("chatRoomPassword", password);
        } else {
          localStorage.removeItem("chatRoomPassword");
        }
        onJoinSuccess(response.roomName, password);
      } else {
        setError("Failed to join or create a room. Please try again.");
      }
    });
  };

  if (!connected) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="join-form" style={{ position: "relative" }}>
      {!showForm && (
        <button
          className="create-room-btn"
          style={{ width: "100%" }}
          onClick={openForm}
          type="button"
        >
          Create New Room
        </button>
      )}
      <div className={`join-form-slide${showForm ? (animateOpen ? "" : " closed") : " closed"}`}>
        {showForm && (
          <>
            <button
              type="button"
              className="close-btn"
              onClick={closeForm}
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={joinRoom}>
              <h2 className="join-form-title">Create a New Chat Room</h2>
              <p className="join-form-desc">
                Fill in the information below to create a new chat room.
              </p>
              <div className="form-group centered">
                <label>Max users in room</label>
                <div className="chair-grid">
                  {[...Array(16)].map((_, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`chair-btn${i < maxUsers ? " selected" : ""}`}
                      onClick={() => setMaxUsers(i + 1)}
                      aria-label={`Set max users to ${i + 1}`}
                      tabIndex={0}
                    >
                      <span role="img" aria-label="chair">🪑</span>
                    </button>
                  ))}
                </div>
                <div className="chair-count-label">
                  {maxUsers} {maxUsers === 1 ? "user" : "users"}
                </div>
              </div>
              <div className="form-group centered">
                <label htmlFor="password">Password (optional)</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="password-input"
                  />
                  <span className="password-icon" role="img" aria-label="key">🔑</span>
                </div>
              </div>
              <div className="form-group centered">
                <label>Tags</label>
                <div className="tag-select">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      className={`tag-btn tag-color-${tag.replace(/ /g, "-")}${selectedTags.includes(tag) ? " selected" : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="create-room-btn">Create Room</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinForm;
import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css";
import toast from 'react-hot-toast';

interface JoinFormProps {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  onJoinSuccess: (roomName: string, password?: string) => void;
}

const TAG_OPTIONS = [
  "First Timer",
  "Pro",
  "Please Be Quiet",
  "Open Discussion",
  "Strangers Welcome"
];

const JoinForm: React.FC<JoinFormProps> = ({ name, setName, onJoinSuccess }) => {
  const [error, setError] = React.useState("");
  const socket = useSocket();
  const [maxUsers, setMaxUsers] = React.useState<number>(6);
  const [password, setPassword] = React.useState("");
  const [connected, setConnected] = React.useState(socket.connected);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  React.useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;

    if (!name.trim()) {
      toast.error("You must enter your name!");
      return;
    }

    const payload: any = { name, maxUsers, tags: selectedTags };
    if (password && password.length > 0) payload.password = password;

    socket.emit("requestRoom", payload, (response: { success: boolean; roomName?: string }) => {
      if (response.success && response.roomName) {
        localStorage.setItem("chatName", name);
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

  if (!showForm) {
    return (
      <div className="join-form">
        <button
          className="create-room-btn"
          style={{ width: "100%" }}
          onClick={() => setShowForm(true)}
          type="button"
        >
          Create New Room
        </button>
      </div>
    );
  }

  return (
    <div className="join-form" style={{ position: "relative" }}>
      {/* Kryss-knapp uppe till höger */}
      <button
        type="button"
        className="close-btn"
        onClick={() => setShowForm(false)}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          background: "none",
          border: "none",
          fontSize: "1.5rem",
          cursor: "pointer",
          color: "#888"
        }}
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
    </div>
  );
};

export default JoinForm;
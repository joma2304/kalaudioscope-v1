import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import "./JoinForm.css";
import { CircleX } from "lucide-react";

interface JoinFormProps {
  userId: string;
  onJoinSuccess: (roomName: string, password?: string) => void;
}

const availableTags = [
  { name: "Opera pro", color: "#6366f1" },
  { name: "Quiet room", color: "#10b981" },
  { name: "Chatting", color: "#f59e0b" },
  { name: "Beginner", color: "#3b82f6" },
  { name: "Talk after show", color: "#ef4444" },
  { name: "Meet new people", color: "#8b5cf6" },
  { name: "First-timers welcome", color: "#22c55e" },
  { name: "Discussion-focused", color: "#eab308" },
  { name: "Silent viewers", color: "#6b7280" },
  { name: "Casual hangout", color: "#0ea5e9" },
  { name: "Q&A after", color: "#14b8a6" },
  { name: "No spoilers", color: "#f97316" },
  { name: "Late joiners ok", color: "#60a5fa" },
];

const JoinForm: React.FC<JoinFormProps> = ({ userId, onJoinSuccess }) => {
  const socket = useSocket();
  const [maxUsers, setMaxUsers] = useState<number>(6);
  const [password, setPassword] = useState("");
  const [connected, setConnected] = useState(socket.connected);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      toast.error("Not connected to the server.");
      return;
    }

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
        toast.error("Failed to join or create a room. Please try again.");
      }
    });
  };

  if (!connected) {
    return <div className="loading">Connecting...</div>;
  }

  return (
    <>
      {!isFormVisible && (
        <button
          className="toggle-form-button"
          onClick={() => setIsFormVisible(true)}
        >
          Create a new chatroom
        </button>
      )}

      <div className={`create-room-container ${isFormVisible ? "open" : ""}`}>
        {isFormVisible && (
          <form className="create-room-form" onSubmit={joinRoom}>
            <button
              className="close-form-button"
              onClick={() => setIsFormVisible(false)}
              type="button"
            >
              <CircleX />
            </button>

            <h3 className="create-room-header">Create a new chatroom</h3>

            <label className="create-room-label">Select amount of seats in chatroom</label>
            <div className="chair-grid">
              {[...Array(30)].map((_, i) => (
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
              {maxUsers} {maxUsers === 1 ? "seat selected" : "seats selected"}
            </div>

            <label className="create-room-label">Password (optional)</label>
            <input
              className="create-room-input"
              type="password"
              placeholder="Enter password if you want to restrict access"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="create-room-label">Select tags for your room</label>
            <div className="create-room-tags">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <label
                    key={tag.name}
                    className={`tag-checkbox${isSelected ? " selected" : ""}`}
                    style={{ "--tag-color": tag.color } as React.CSSProperties}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTag(tag.name)}
                      style={{ display: "none" }}
                    />
                    #{tag.name}
                  </label>
                );
              })}
            </div>

            <button type="submit" className="create-room-button">
              Create Room
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default JoinForm;
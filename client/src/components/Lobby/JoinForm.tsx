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
  { name: "Opera pro", color: "#3730a3" },         // Mörk indigo
  { name: "Quiet room", color: "#047857" },        // Mörk smaragd
  { name: "Chatting", color: "#b45309" },          // Mörk bärnsten
  { name: "Beginner", color: "#1d4ed8" },          // Mörk blå
  { name: "Talk after show", color: "#b91c1c" },   // Mörk röd
  { name: "Meet new people", color: "#5b21b6" },   // Mörk violett
  { name: "First-timers welcome", color: "#15803d" }, // Mörk grön
  { name: "Discussion-focused", color: "#a16207" },   // Mörk gul
  { name: "Silent viewers", color: "#1f2937" },        // Mörkgrå
  { name: "Casual hangout", color: "#0369a1" },        // Mörk himmelsblå
  { name: "Q&A after", color: "#0f766e" },             // Mörk teal
  { name: "No spoilers", color: "#c2410c" },           // Mörk orange
  { name: "Late joiners ok", color: "#1e40af" }        // Mörkare blå
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
              aria-label="Close form"
              onClick={() => setIsFormVisible(false)}
              type="button"
            >
              <CircleX />
            </button>

            <h2 className="create-room-header">Create a new chatroom</h2>
            <br />
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

            <label htmlFor="password" className="create-room-label">Password (optional)</label>
            <input
              id="password"
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
                  htmlFor={tag.name}
                    key={tag.name}
                    className={`tag-checkbox${isSelected ? " selected" : ""}`}
                    style={{ "--tag-color": tag.color } as React.CSSProperties}
                  >
                    <input
                      id={tag.name}
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
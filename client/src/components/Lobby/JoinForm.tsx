import React from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css";

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
      setError("You must enter a name!");
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

  return (
    <div className="join-form">
      <form onSubmit={joinRoom}>
        <h2 className="join-form-title">Create a New Chat Room</h2>
        <p className="join-form-desc">
          Fill in the information below to create a new chat room.
        </p>
        <div className="form-group">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="max-users">Max users in room</label>
          <input
            id="max-users"
            type="number"
            value={maxUsers}
            onChange={(e) => setMaxUsers(Number(e.target.value))}
            min={1}
            max={99}
            step={1}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password (optional)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Tags</label>
          <div className="tag-select">
            {TAG_OPTIONS.map(tag => (
              <button
                type="button"
                key={tag}
                className={`tag-btn${selectedTags.includes(tag) ? " selected" : ""}`}
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
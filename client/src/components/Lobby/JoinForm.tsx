import React from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css"; // Importera CSS-filen för stilning

interface JoinFormProps {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  onJoinSuccess: (roomName: string, password?: string) => void; // Skicka med password
}

const JoinForm: React.FC<JoinFormProps> = ({ name, setName, onJoinSuccess }) => {
  const [error, setError] = React.useState("");
  const socket = useSocket();
  const [maxUsers, setMaxUsers] = React.useState<number>(6); // Default är 6
  const [password, setPassword] = React.useState("");
  const [connected, setConnected] = React.useState(socket.connected);

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

    const payload: any = { name, maxUsers };
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
        onJoinSuccess(response.roomName, password); // Skicka med password
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
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label htmlFor="max-users" style={{ fontWeight: 500, marginBottom: 4 }}>
          Max users in box:
        </label>
        <input
          id="max-users"
          type="number"
          placeholder="Max users"
          value={maxUsers}
          onChange={(e) => setMaxUsers(Number(e.target.value))}
          min={1}
          max={99}
          step={1}
          required
        />
        <input
          type="password"
          placeholder="Password (optional)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Create Box</button>
      </form>
    </div>
  );
};

export default JoinForm;
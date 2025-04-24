import React from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css"; // Importera CSS för JoinForm

interface JoinFormProps {
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    onJoinSuccess: (roomName: string) => void;
  }
  
  const JoinForm: React.FC<JoinFormProps> = ({ name, setName, onJoinSuccess }) => {
    const [error, setError] = React.useState("");
    const socket = useSocket();
    const [maxUsers, setMaxUsers] = React.useState<number | null>(null);
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
  
      socket.emit("requestRoom", { name, maxUsers, password }, (response: { success: boolean; roomName?: string }) => {
        if (response.success && response.roomName) {
          localStorage.setItem("chatName", name);
          localStorage.setItem("chatRoom", response.roomName);
          onJoinSuccess(response.roomName);
        } else {
          setError("Failed to join or create a room. Please try again.");
        }
      });
    };
  
    if (!connected) {
      return <div>Connecting to server...</div>;
    }
  

    return (
        <div className="create-room-container">
            <form className="create-room-form" onSubmit={joinRoom}>
                <input
                    className="create-room-input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    className="create-room-input"
                    type="number"
                    placeholder="Max users (optional)"
                    value={maxUsers || ""}
                    onChange={(e) => setMaxUsers(Number(e.target.value) || null)}
                    min="1"
                />
                {error && <p className="create-room-error-message">{error}</p>}
                <button className="create-room-button" type="submit">Create chatroom</button>
            </form>
        </div>
    );
};


export default JoinForm;
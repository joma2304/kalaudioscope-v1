import React from "react";
import { useSocket } from "../../context/SocketContext";

interface JoinFormProps {
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
}

const JoinForm: React.FC<JoinFormProps> = ({ name, setName }) => {
    const [error, setError] = React.useState("");
    const socket = useSocket();
    const [maxUsers, setMaxUsers] = React.useState<number | null>(null);


    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
      
        if (!name.trim()) {
          setError("You must enter a name!");
          return;
        }
      
        // Emit an event to request a room with an auto-generated name
        socket.emit("requestRoom", { name }, (response: { success: boolean; roomName?: string }) => {
          if (response.success && response.roomName) {
            localStorage.setItem("chatName", name);
            localStorage.setItem("chatRoom", response.roomName);
      
            // If maxUsers is set, emit an event to set the room limit
            if (maxUsers) {
              socket.emit("setRoomLimit", { room: response.roomName, maxUsers }, (limitResponse: { success: boolean; message: string }) => {
                if (!limitResponse.success) {
                  console.error(limitResponse.message);
                }
              });
            }
      
            // Reload the page to show ChatApp
            window.location.reload();
          } else {
            setError("Failed to join or create a room. Please try again.");
          }
        });
      };

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
                <input
                    type="number"
                    placeholder="Max users (optional)"
                    value={maxUsers || ""}
                    onChange={(e) => setMaxUsers(Number(e.target.value) || null)}
                    min="1"
                />
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Create chatroom</button>
            </form>
        </div>
    );
};

export default JoinForm;
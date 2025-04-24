import React from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css"; // Importera CSS för JoinForm

interface JoinFormProps {
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    onJoinSuccess: (roomName: string, password?: string) => void; // Skicka med password
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

        if (maxUsers === null || maxUsers < 1 || maxUsers > 30) {
            setError("You must choose a valid max number of users (1–30).");
            return;
        }

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
        <div className="create-room-container">
            <form className="create-room-form" onSubmit={joinRoom}>
                <h3 className="create-room-header">Create a new chatroom</h3>
                <p className="create-room-description">You must always enter your name, even when you are joining an existing room.</p>
                <label className="create-room-label">Name:</label>
                <input
                    className="create-room-input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    
                />
                <label className="create-room-label">Max amount of users:</label>
                <input
                    className="create-room-input"
                    type="number"
                    placeholder="Max users (1-30)"
                    value={maxUsers !== null ? maxUsers : ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        setMaxUsers(value === "" ? null : Number(value));
                    }}
                    min="1"
                    max={30}
                    step={1}
                    
                />
                <label className="create-room-label">Password:</label>
                <input
                    className="create-room-input"
                    type="password"
                    placeholder="Password (optional)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                {error && <p className="create-room-error-message">{error}</p>}
                <button className="create-room-button" type="submit">Create chatroom</button>
            </form>
        </div>
    );
};


export default JoinForm;
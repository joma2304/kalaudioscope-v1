import React from "react";
import { useSocket } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import NameInput from "./NameInput";
import "./JoinForm.css";
import { CircleX } from "lucide-react";

interface JoinFormProps {
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    onJoinSuccess: (roomName: string, password?: string) => void;
}

const JoinForm: React.FC<JoinFormProps> = ({ name, setName, onJoinSuccess }) => {
    const socket = useSocket();
    const [maxUsers, setMaxUsers] = React.useState<number | null>(null);
    const [password, setPassword] = React.useState("");
    const [connected, setConnected] = React.useState(socket.connected);
    const [isFormVisible, setIsFormVisible] = React.useState(false); // Hantera formulärets synlighet

    const availableTags = ["Opera pro",
        "Quiet room",
        "Chatting",
        "Beginner",
        "Talk after show",
        "Meet new people",
        "First-timers welcome",
        "Discussion-focused",
        "Silent viewers",
        "Live reactions",
        "Fans only",
        "Casual hangout",
        "Q&A after",
        "Interpretation talk",
        "Serious watchers",
        "No spoilers",
        "Relaxed vibe",
        "Late joiners ok"];
        
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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
        if (!connected) {
            toast.error("Not connected to the server.");
            return;
        }

        if (maxUsers === null || maxUsers < 1 || maxUsers > 30) {
            toast.error("You must choose a valid max amount of users (1–30).");
            return;
        }

        if (!name.trim()) {
            toast.error("You must enter a name!");
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
                toast.success("Room created successfully!");
            } else {
                toast.error("Failed to join or create a room. Please try again.");
            }
        });
    };

    if (!connected) {
        return <div>Connecting to server...</div>;
    }

    return (
        <>
            <NameInput name={name} setName={setName} />

            {/* Knapp för att öppna formuläret */}
            {!isFormVisible && (
                <button
                    className="toggle-form-button"
                    onClick={() => setIsFormVisible(true)}
                >
                    Create a new chatroom
                </button>
            )}

            {/* Formuläret med animation */}
            <div className={`create-room-container ${isFormVisible ? "open" : ""}`}>
                {isFormVisible && (
                    <form className="create-room-form" onSubmit={joinRoom}>
                        {/* "X"-knapp för att stänga formuläret */}
                        <button
                            className="close-form-button"
                            onClick={() => setIsFormVisible(false)}
                            type="button"
                        >
                            <CircleX />
                        </button>

                        <h3 className="create-room-header">Create a new chatroom</h3>
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
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <label className="create-room-label">Select tags for chatroom:</label>
                        <div className="create-room-tags">
                            {availableTags.map((tag) => (
                                <label key={tag} className="tag-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedTags.includes(tag)}
                                        onChange={() => toggleTag(tag)}
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>

                        <button className="create-room-button" type="submit">
                            Create chatroom
                        </button>
                    </form>
                )}
            </div>
        </>
    );
};

export default JoinForm;

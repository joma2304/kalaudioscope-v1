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
  { name: "Live reactions", color: "#ec4899" },
  { name: "Fans only", color: "#f43f5e" },
  { name: "Casual hangout", color: "#0ea5e9" },
  { name: "Q&A after", color: "#14b8a6" },
  { name: "Interpretation talk", color: "#a855f7" },
  { name: "Serious watchers", color: "#d946ef" },
  { name: "No spoilers", color: "#f97316" },
  { name: "Relaxed vibe", color: "#4ade80" },
  { name: "Late joiners ok", color: "#60a5fa" },
];

    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

    const toggleTag = (tagName: string) => {
  setSelectedTags((prev) =>
    prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
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

        if (!name.trim()) {
            toast.error("You must enter a name!");
            return;
        }

        if (maxUsers === null || maxUsers < 1 || maxUsers > 30) {
            toast.error("You must choose a valid max amount of users (1–30).");
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
                          {availableTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.name); // Kontrollera om taggen är vald
                            return (
                              <label
                                key={tag.name}
                                className="tag-checkbox"
                                style={{
                                  backgroundColor: isSelected ? "#fff" : tag.color, // Ändra bakgrundsfärg om vald
                                  color: isSelected ? tag.color : "#fff", // Ändra textfärg om vald
                                  border: isSelected ? ` solid 1px ${tag.color}` : "none", // Lägg till kantlinje om vald
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTag(tag.name)}
                                  style={{ display: "none" }} // Dölj checkboxen
                                />
                                {tag.name}
                              </label>
                            );
                          })}
                        </div>

                        <button className="create-room-button" type="submit">
                           <span>Create chatroom</span>
                        </button>
                    </form>
                )}
            </div>
        </>
    );
};

export default JoinForm;

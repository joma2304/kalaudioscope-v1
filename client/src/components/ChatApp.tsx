import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import "./ChatApp.css";

interface Message {
    name: string;
    text: string;
    time: string;
}

const ChatApp = () => {
    const socket = useSocket();
    const [name, setName] = useState("");
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [activity, setActivity] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {

        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
    
        if (storedName && storedRoom) {
            setName(storedName);
            setRoom(storedRoom);
            socket.emit("enterRoom", { name: storedName, room: storedRoom });
        }

        socket.on("message", (data: Message) => {
            setMessages((prev) => [...prev, data]);
            setActivity("");
        });

        socket.on("userList", ({ users }: { users: { name: string }[] }) => {
            setUsers(users.map((user) => user.name));
        });

        socket.on("activity", (name: string | null) => {
            setActivity(name ? `${name} skriver...` : ""); 
        });

        return () => {
            socket.off("message");
            socket.off("userList");
            socket.off("activity");
        };
    }, [socket]);

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && room) {
            localStorage.setItem("chatName", name);
            localStorage.setItem("chatRoom", room);
            socket.emit("enterRoom", { name, room });
        }
    };
    

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && message) {
            socket.emit("message", { name, text: message });
            setMessage("");
        }
    };

    const leaveChat = () => {
        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");
        socket.emit("leaveRoom", { name, room });
        setName("");
        setRoom("");
    };
    

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTyping = () => {
        if (!isTyping) {
            socket.emit("activity", name);
            setIsTyping(true);
        }
    
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("activity", null);
            setIsTyping(false);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div>
            <form onSubmit={joinRoom}>
                <input type="text" placeholder="Ditt namn" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Rum" value={room} onChange={(e) => setRoom(e.target.value)} required />
                <button type="submit">Anslut</button>
            </form>

            <div className="chat-display" ref={chatRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`post ${msg.name === "Admin" ? "post--system" : (msg.name === name ? "post--right" : "post--left")}`}>
                        {msg.name !== "Admin" && <strong>{msg.name}:</strong>}
                        <span>{msg.text}</span>
                        <em>{msg.time}</em>
                    </div>
                ))}
            </div>

            <p>{activity}</p>

            <form onSubmit={sendMessage}>
                <input type="text" placeholder="Ditt meddelande" value={message} onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={() => {
                        if (!typingTimeoutRef.current) {
                            handleTyping();
                        }
                    }} required />
                <button type="submit">Skicka</button>
            </form>

            <p>Användare i rummet: {users.join(", ")}</p>
            <button onClick={leaveChat}>Lämna chatten</button>

        </div>
    );
};

export default ChatApp;

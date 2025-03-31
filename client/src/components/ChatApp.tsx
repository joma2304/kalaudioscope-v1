import { useState, useEffect } from "react";
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

    useEffect(() => {
        socket.on("message", (data: Message) => {
            setMessages((prev) => [...prev, data]);
            setActivity("");
        });

        socket.on("userList", ({ users }: { users: { name: string }[] }) => {
            setUsers(users.map((user) => user.name));
        });

        socket.on("activity", (name: string) => {
            setActivity(`${name} skriver...`);
            setTimeout(() => setActivity(""), 3000);
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

    return (
        <div>
            <form onSubmit={joinRoom}>
                <input type="text" placeholder="Ditt namn" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Rum" value={room} onChange={(e) => setRoom(e.target.value)} required />
                <button type="submit">Anslut</button>
            </form>

            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>
                        <strong>{msg.name}:</strong> {msg.text} <em>({msg.time})</em>
                    </li>
                ))}
            </ul>

            <p>{activity}</p>

            <form onSubmit={sendMessage}>
                <input type="text" placeholder="Ditt meddelande" value={message} onChange={(e) => setMessage(e.target.value)} required />
                <button type="submit">Skicka</button>
            </form>

            <p>Användare i rummet: {users.join(", ")}</p>
        </div>
    );
};

export default ChatApp;

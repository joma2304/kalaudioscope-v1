import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import "./Lobby.css";

interface Room {
    name: string;
    userCount: number;
}

interface LobbyProps {
    onRoomSelect: (roomName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onRoomSelect }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [name, setName] = useState("");
    const [newRoomName, setNewRoomName] = useState("");
    const [error, setError] = useState("");
    const socket = useSocket();

    useEffect(() => {
        // Lyssna på uppdateringar av rumslistan
        socket.on("roomList", (data: any) => {
            console.log("Mottagen roomList från servern:", data); // Debugga serverns svar
            const roomList = Array.isArray(data) ? data : data.rooms; // Hantera både array och objekt
            if (Array.isArray(roomList)) {
                setRooms(roomList);
            } else {
                console.error("roomList är inte en array:", data);
                setRooms([]);
            }
        });

        // Begär rumslistan från servern
        socket.emit("getRoomList");

        return () => {
            socket.off("roomList");
        };
    }, [socket]);

    const joinRoom = (roomName: string) => {
        if (!name.trim()) {
            setError("Du måste ange ett namn!");
            return;
        }
    
        localStorage.setItem("chatName", name);
        socket.emit("enterRoom", { name, room: roomName }); // Skicka namn och rum till servern
        onRoomSelect(roomName); // Anropa onRoomSelect med valt rum
    };

    const createRoom = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newRoomName.trim()) {
            setError("Du måste ange ett namn för rummet!");
            return;
        }

        // Skicka rumsnamnet till servern
        socket.emit("createRoom", newRoomName, (success: boolean) => {
            if (success) {
                joinRoom(newRoomName); // Gå automatiskt in i det skapade rummet
            } else {
                setError("Kunde inte skapa rummet. Försök igen.");
            }
        });

        setNewRoomName(""); // Rensa fältet efter skapandet
    };

    return (
        <div className="lobby">
            <h1>Välkommen till lobbyn</h1>
            <div className="name-input">
                <input
                    type="text"
                    placeholder="Ditt namn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div className="room-list">
                {Array.isArray(rooms) && rooms.length > 0 ? (
                    rooms.map((room) => (
                        <div
                            key={room.name} // Använd rumsnamnet som nyckel om det är unikt
                            className="room-item"
                            onClick={() => joinRoom(room.name)}
                        >
                            <span>{room.name} ({room.userCount} anslutna)</span>
                        </div>
                    ))
                ) : (
                    <p>Inga rum tillgängliga</p>
                )}
            </div>
            <form onSubmit={createRoom} className="create-room-form">
                <input
                    type="text"
                    placeholder="Skapa nytt rum"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    required
                />
                <button type="submit">Skapa rum</button>
            </form>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default Lobby;
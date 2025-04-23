import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./RoomList.css"; // Importera CSS för RoomList

interface Room {
    name: string;
    userCount: number;
    maxUsers?: number; // Lägg till maxUsers för att indikera maxgränsen
}

interface RoomListProps {
    onJoinRoom: (roomName: string) => void; // Prop för att hantera rumsinträde
}

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom }) => {
    const socket = useSocket();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [error, setError] = useState<string | null>(null); // State för felmeddelande


    useEffect(() => {
        const handleRoomList = (rooms: Room[]) => {
            setRooms(rooms);
        };

        socket.on("roomList", handleRoomList);

        // Begär uppdaterad rumslista
        socket.emit("getRoomList");

        return () => {
            socket.off("roomList", handleRoomList);
        };
    }, [socket]);

    return (
        <div className="room-list-container">
            <h3 className="room-list-header">Join an active room</h3>
            {rooms.length > 0 ? (
                <ul className="room-list">
                    {rooms.map((room, index) => {
                        const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers;

                        return (
                            <li key={index} className="room-item">
                                <button
                                    onClick={() => !isFull && onJoinRoom(room.name)}
                                    className={`room-button ${isFull ? "room-button-full" : ""}`}
                                    disabled={isFull}
                                >
                                    {room.name} ({room.userCount}
                                    {room.maxUsers ? ` / ${room.maxUsers} users` : ""})
                                    {isFull && " - Room is full"}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="no-rooms-message">No active rooms</p>
            )}
        </div>
    );
};

export default RoomList;
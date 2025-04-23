import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext'; // Importera useSocket

interface Room {
    name: string;
    userCount: number;
}

const RoomList: React.FC = () => {
    const socket = useSocket();
    const [rooms, setRooms] = useState<Room[]>([]);

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

    const handleJoinRoom = (roomName: string) => {
        socket.emit("joinRoom", roomName);
        console.log(`Joining room: ${roomName}`);
        // Du kan också lägga till navigation här om du har routes per rum
    };

    return (
        <div className="room-list">
            <h3>Active rooms</h3>
            {rooms.length > 0 ? (
                <ul>
                    {rooms.map((room, index) => (
                        <li key={index}>
                            <button
                                onClick={() => handleJoinRoom(room.name)}
                                className="text-blue-600 hover:underline"
                            >
                                {room.name} ({room.userCount} användare)
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No active rooms</p>
            )}
        </div>
    );
};

export default RoomList;
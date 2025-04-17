import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoomListProps {
    socketUrl: string; // URL för Socket.IO-servern
}

const RoomList: React.FC<RoomListProps> = ({ socketUrl }) => {
    const [rooms, setRooms] = useState<string[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Anslut till Socket.IO-servern
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        // Lyssna på uppdateringar av rumslistan
        newSocket.on('roomList', ({ rooms }: { rooms: string[] }) => {
            setRooms(rooms);
        });

        // Stäng anslutningen vid avmontering
        return () => {
            newSocket.disconnect();
        };
    }, [socketUrl]);

    return (
        <div className="room-list">
            <h3>Active Rooms</h3>
            {rooms.length > 0 ? (
                <ul>
                    {rooms.map((room, index) => (
                        <li key={index}>{room}</li>
                    ))}
                </ul>
            ) : (
                <p>No active rooms</p>
            )}
        </div>
    );
};

export default RoomList;
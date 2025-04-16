import React from "react";

interface Room {
    name: string;
    userCount: number;
}

interface RoomListProps {
    rooms: Room[];
    onJoinRoom: (roomName: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onJoinRoom }) => {
    return (
        <ul className="room-list">
            {rooms.map((room) => (
                <li key={room.name} className="room-item">
                    <span>{room.name} ({room.userCount} användare)</span>
                    <button onClick={() => onJoinRoom(room.name)}>Gå med</button>
                </li>
            ))}
        </ul>
    );
};

export default RoomList;
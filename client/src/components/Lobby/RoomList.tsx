import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";

interface Room {
  name: string;
  userCount: number;
}

interface RoomListProps {
  onJoinRoom: (roomName: string) => void; // Prop för att hantera rumsinträde
}

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom }) => {
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

  return (
    <div className="room-list">
      <h3>Active rooms</h3>
      {rooms.length > 0 ? (
        <ul>
          {rooms.map((room, index) => (
            <li key={index}>
              <button
                onClick={() => onJoinRoom(room.name)} // Anropa onJoinRoom när ett rum klickas
                className="text-blue-600 hover:underline"
              >
                {room.name} ({room.userCount} user(s))
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
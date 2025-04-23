import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";

interface Room {
  name: string;
  userCount: number;
  maxUsers?: number;
  hasPassword?: boolean;
}

interface RoomListProps {
  onJoinRoom: (roomName: string, password?: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom }) => {
  const socket = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (!connected) return;

    const handleRoomList = (rooms: Room[]) => {
      setRooms(rooms);
    };

    socket.on("roomList", handleRoomList);
    socket.emit("getRoomList");

    return () => {
      socket.off("roomList", handleRoomList);
    };
  }, [socket, connected]);

  const handleJoin = (room: Room) => {
    if (!connected) return;
    if (room.hasPassword) {
      const password = prompt("Enter room password:");
      onJoinRoom(room.name, password || "");
    } else {
      onJoinRoom(room.name);
    }
  };

  if (!connected) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="room-list">
      <h3>Active rooms</h3>
      {rooms.length > 0 ? (
        <ul>
          {rooms.map((room, index) => {
            const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers;
            return (
              <li key={index}>
                <button
                  onClick={() => !isFull && handleJoin(room)}
                  className={`text-blue-600 hover:underline ${isFull ? "text-gray-400 cursor-not-allowed" : ""}`}
                  disabled={isFull}
                >
                  {room.name} ({room.userCount}
                  {room.maxUsers ? ` / ${room.maxUsers}` : ""})
                  {room.hasPassword && " 🔒"}
                  {isFull && " - Full"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No active rooms</p>
      )}
    </div>
  );
};

export default RoomList;
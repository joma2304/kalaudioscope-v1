import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./RoomList.css"; // Importera CSS för RoomList

interface Room {
  name: string;
  userCount: number;
  maxUsers?: number;
  hasPassword?: boolean;
  tags?: string[]; //Taggar

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
                  onClick={() => !isFull && handleJoin(room)}
                  className={`room-button ${isFull ? "room-button-full" : ""}`}
                  disabled={isFull}
                >
                  ({room.userCount}
                  {room.maxUsers ? ` / ${room.maxUsers} users` : ""})
                  {isFull && " - Room is full"}
                  {room.hasPassword && " - Password required 🔒"}
                  {/* Visa taggarna här */}
                  {room.tags && room.tags.length > 0 && (
                    <div className="room-tags">
                      {room.tags.map((tags, i) => (
                        <span key={i} className="room-tag">
                          #{tags}
                        </span>
                      ))}
                    </div>
                  )}
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
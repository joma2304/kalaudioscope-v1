import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./RoomList.css"; // Importera CSS-filen för stilning

interface Room {
  name: string;
  userCount: number;
  maxUsers?: number;
  hasPassword?: boolean;
  tags?: string[];
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
      <form className="room-list-form">
        <ul>
          {rooms.length > 0 ? (
            rooms.map((room) => {
              const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers;
              return (
                <li key={room.name} className={`room-list-item${isFull ? " full" : ""}`}>
                  <div className="room-info">
                    <span className="room-title">{`Box ${room.name}`}</span>
                    {room.hasPassword && <span className="room-lock">🔒</span>}
                    {room.tags && room.tags.length > 0 && (
                      <span className="room-tags">
                        {room.tags.map(tag => (
                          <span key={tag} className="room-tag" data-tag={tag}>
                            #{tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="room-meta">
                    <span className="room-users">
                      <span className="user-icon" role="img" aria-label="users">👤</span>
                      {room.userCount}/{room.maxUsers || "∞"}
                    </span>
                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => handleJoin(room)}
                    >
                      Join
                    </button>
                  </div>
                </li>
              );
            })
          ) : (
            <div className="room-list-empty">No rooms available</div>
          )}
        </ul>
      </form>
    </div>
  );
};

export default RoomList;
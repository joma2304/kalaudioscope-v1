import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./RoomList.css";
import PasswordModal from "./PasswordModal";
import toast, { Toaster } from 'react-hot-toast';

interface Room {
  name: string;
  userCount: number;
  maxUsers?: number;
  hasPassword?: boolean;
  tags?: string[];
}

interface RoomListProps {
  onJoinRoom: (
    roomName: string,
    password?: string,
    callback?: (result: { success: boolean; message?: string }) => void
  ) => void;
  name: string;
}

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom, name }) => {
  const socket = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [connected, setConnected] = useState(socket.connected);

  // Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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
    if (!name.trim()) {
            toast.error("You must enter your name!");
            return;
        }
    if (!connected) return;
    if (room.hasPassword) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
      setPasswordInput("");
    } else {
      onJoinRoom(room.name);
    }
  };

  const handlePasswordSubmit = () => {
    if (!selectedRoom) return;
    onJoinRoom(selectedRoom.name, passwordInput, (result) => {
      if (result.success) {
        setShowPasswordModal(false);
      } else {
        setPasswordInput("");
        
      }
    });
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
                  <div className="room-info-row">
                    <span className="room-title">{`Box ${room.name}`}</span>
                    {room.hasPassword && <span className="room-lock">🔒</span>}
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
                  {room.tags && room.tags.length > 0 && (
                    <div className="room-tags-row">
                      <span className="room-tags">
                        {room.tags.map(tag => (
                          <span key={tag} className="room-tag" data-tag={tag}>
                            #{tag}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </li>
              );
            })
          ) : (
            <div className="room-list-empty">No rooms available</div>
          )}
        </ul>
      </form>

      {/* Password Modal */}
      {showPasswordModal && selectedRoom && (
        <PasswordModal
          roomName={selectedRoom.name}
          password={passwordInput}
          setPassword={setPasswordInput}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default RoomList;
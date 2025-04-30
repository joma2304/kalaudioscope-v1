import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import PasswordModal from "./PasswordModal"; // Importera modal-komponenten
import "./RoomList.css";

interface Room {
  name: string;
  userCount: number;
  maxUsers?: number;
  hasPassword?: boolean;
  tags?: string[];
}

interface RoomListProps {
  onJoinRoom: (roomName: string, password?: string) => void;
  username: string;
}

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom, username }) => {
  const socket = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [connected, setConnected] = useState(socket.connected);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Hantera modalens öppning
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // Håll reda på valt rum

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

    if (!username) {
      setErrorMessage("Please enter a username before joining a room.");
      return;
    }

    setErrorMessage(null);

    if (room.hasPassword) {
      setSelectedRoom(room); // Sätt valt rum
      setIsModalOpen(true); // Öppna modalen
    } else {
      onJoinRoom(room.name);
    }
  };

  const handleModalSubmit = async (password: string) => {
    if (selectedRoom) {
      return new Promise<boolean>((resolve) => {
        socket.emit("enterRoom", { name: username, room: selectedRoom.name, password }, (response: { success: boolean; message: string }) => {
          if (response.success) {
            resolve(true); // Lösenordet är korrekt
          } else {
            resolve(false); // Lösenordet är felaktigt
          }
        });
      });
    }
    return false;
  };

  return (
    <div className="room-list-container">
      <h3 className="room-list-header">Join an active room</h3>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

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
                  {room.userCount}
                  {room.maxUsers ? `/${room.maxUsers} Users in room` : ""}
                  {isFull && " (No spots available)"}
                  {room.hasPassword && " - Password required 🔒"}
                  {room.tags && room.tags.length > 0 && (
                    <div className="room-tags">
                      {room.tags.map((tag, i) => (
                        <span key={i} className="room-tag">
                          #{tag}
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

      {/* Lösenordsmodalen */}
      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default RoomList;
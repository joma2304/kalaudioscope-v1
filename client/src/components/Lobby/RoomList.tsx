import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import PasswordModal from "./PasswordModal"; // Importera modal-komponenten
import { toast } from "react-hot-toast"; // Importera React Hot Toast
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
  const [isModalOpen, setIsModalOpen] = useState(false); // Hantera modalens öppning
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // Håll reda på valt rum

  const tagColors: { [key: string]: string } = {
    "Opera pro": "#6366f1",
    "Quiet room": "#10b981",
    "Chatting": "#f59e0b",
    "Beginner": "#3b82f6",
    "Talk after show": "#ef4444",
    "Meet new people": "#8b5cf6",
    "First-timers welcome": "#22c55e",
    "Discussion-focused": "#eab308",
    "Silent viewers": "#6b7280",
    "Live reactions": "#ec4899",
    "Fans only": "#f43f5e",
    "Casual hangout": "#0ea5e9",
    "Q&A after": "#14b8a6",
    "Interpretation talk": "#a855f7",
    "Serious watchers": "#d946ef",
    "No spoilers": "#f97316",
    "Relaxed vibe": "#4ade80",
    "Late joiners ok": "#60a5fa",
  };

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
    if (!connected) {
      toast.error("Not connected to the server."); // Visa toast för anslutningsfel
      return;
    }

    if (!username) {
      toast.error("Please enter your name before joining a room."); // Visa toast för användarnamn
      return;
    }

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
            onJoinRoom(selectedRoom.name, password); // Gå med i rummet
            setIsModalOpen(false); // Stäng modalen
            toast.success("Successfully joined the room!"); // Visa toast för lyckad inloggning
          
          } else {
            toast.error("Incorrect password. Please try again."); // Visa toast för fel lösenord
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
                        <span key={i} className="room-tag"
                        style={{
                          backgroundColor: tagColors[tag] || "#e5e7eb", // Använd färg från tagColors eller en standardfärg
                        }}>
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
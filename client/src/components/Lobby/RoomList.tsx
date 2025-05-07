import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import PasswordModal from "./PasswordModal";
import { toast } from "react-hot-toast";
import "./RoomList.css";

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
  userId: string;
}

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
  "Casual hangout": "#0ea5e9",
  "Q&A after": "#14b8a6",
  "No spoilers": "#f97316",
  "Late joiners ok": "#60a5fa",
};

const RoomList: React.FC<RoomListProps> = ({ onJoinRoom, userId }) => {
  const socket = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [connected, setConnected] = useState(socket.connected);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      socket.emit("getRoomList"); // Begär rumslistan vid anslutning
    };
  
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
    if (!userId.trim()) {
      toast.error("User ID is missing.");
      return;
    }
    if (!connected) {
      toast.error("Not connected to the server.");
      return;
    }

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
        toast.error("Incorrect password. Please try again.");
      }
    });
  };

  const toggleFilter = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredRooms = filterTags.length === 0
    ? rooms
    : rooms.filter((room) =>
        (room.tags ?? []).some((tag) => filterTags.includes(tag))
      );

  if (!connected) {
    return <div>Loading list of active chatrooms...</div>;
  }

  return (
    <div className="room-list-container">
      <h3 className="room-list-header">Join an active room</h3>
      <p className="tag-info">Filter active rooms by tags</p>

      {/* Filter tags */}
      <div className="filter-tags">
        {Object.keys(tagColors).map((tag) => {
          const isSelected = filterTags.includes(tag);
          return (
            <span
              key={tag}
              className={`filter-tag ${isSelected ? "selected" : ""}`}
              onClick={() => toggleFilter(tag)}
              style={{
                backgroundColor: isSelected ? "#fff" : tagColors[tag],
                color: isSelected ? tagColors[tag] : "#fff",
                border: isSelected ? `2px solid ${tagColors[tag]}` : "none",
              }}
            >
              #{tag}
            </span>
          );
        })}
      </div>

      {/* Room list */}
      {filteredRooms.length > 0 ? (
        <ul className="room-list">
          {filteredRooms.map((room, index) => {
            const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers;

            return (
              <li key={index} className="room-item">
                <button
                  onClick={() => !isFull && handleJoin(room)}
                  className={`room-button ${isFull ? "room-button-full" : ""}`}
                  disabled={isFull}
                >
                  <div className="room-info">
                    <span className="room-users">
                      {room.userCount}/{room.maxUsers || "∞"} Users
                    </span>
                    {isFull && <span className="room-full-message"> (No spots available)</span>}
                    {room.hasPassword && <span className="room-lock"> - Password required 🔒</span>}
                  </div>

                  {/* Room tags */}
                  {room.tags && room.tags.length > 0 && (
                    <div className="room-tags">
                      {room.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="room-tag"
                          style={{
                            backgroundColor: tagColors[tag] || "#e5e7eb",
                            color: "#fff",
                          }}
                        >
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

      {/* Password modal */}
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

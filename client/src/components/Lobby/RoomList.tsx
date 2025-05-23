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
  "Opera pro": "#3730a3",              // Dark Indigo
  "Quiet room": "#047857",             // Dark Emerald
  "Chatting": "#b45309",               // Dark Amber
  "Beginner": "#1d4ed8",               // Dark Blue
  "Talk after show": "#b91c1c",        // Dark Red
  "Meet new people": "#5b21b6",        // Dark Violet
  "First-timers welcome": "#15803d",   // Dark Green
  "Discussion-focused": "#a16207",     // Dark Yellow
  "Silent viewers": "#1f2937",         // Very Dark Gray
  "Casual hangout": "#0369a1",         // Dark Sky Blue
  "Q&A after": "#0f766e",              // Dark Teal
  "No spoilers": "#c2410c",            // Dark Orange
  "Late joiners ok": "#1e40af"  
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

  useEffect(() => {
    const onRoomListChanged = () => {
      socket.emit("getRoomList");
    };
    window.addEventListener("roomListChanged", onRoomListChanged);
    return () => window.removeEventListener("roomListChanged", onRoomListChanged);
  }, [socket]);

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
      <h2 className="room-list-header">Join an active room</h2>
      <p className="tag-info">Filter active rooms by tags</p>

      {/* Filter tags */}
      <div className="filter-tags">
        {Object.keys(tagColors).map((tag) => {
          const isSelected = filterTags.includes(tag);
          return (
            <span
              key={tag}
              className={`filter-tag${isSelected ? " selected" : ""}`}
              onClick={() => toggleFilter(tag)}
              style={{

                "--tag-color": tagColors[tag]
              } as React.CSSProperties}
            >
              #{tag}
            </span>
          );
        })}
      </div>

      {/* Room list */}
      {filteredRooms.length > 0 ? (
        <>
          <h2 className="room-list-header">Current active rooms:</h2>
          <p className="tag-info">Click on room to join </p>
          <ul className="room-list">
            {filteredRooms.map((room) => {
              const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers;

              return (
                <li key={room.name} className="room-item">
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
                        {room.tags.map((tag) => (
                          <span
                            key={tag}
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
        </>
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
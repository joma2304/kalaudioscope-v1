import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./RoomList.css";
import PasswordModal from "./PasswordModal";
import toast from 'react-hot-toast';

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
  const [filterTags, setFilterTags] = useState<string[]>([]);

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

  const filteredRooms = filterTags.length === 0
    ? rooms
    : rooms.filter(room =>
        (room.tags ?? []).length > 0 && filterTags.every(tag => (room.tags ?? []).includes(tag))
      );

  if (!connected) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="room-list">
      <h2>Available Rooms</h2>
      <div
        style={{
          textAlign: "center",
          marginBottom: "0.3em",
          fontSize: "0.98em",
          color: "#666",
        }}
      >
        Click tags to filter rooms
      </div>
      <div className="room-filter-tags" style={{ marginBottom: "1em", textAlign: "center" }}>
        {["First Timer", "Pro", "Please Be Quiet", "Open Discussion", "Strangers Welcome"].map(tag => (
          <button
            key={tag}
            className={`tag-btn tag-color-${tag.replace(/ /g, "-")}${filterTags.includes(tag) ? " selected" : ""}`}
            onClick={() =>
              setFilterTags(prev =>
                prev.includes(tag)
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              )
            }
            style={{ margin: "0 0.2em" }}
          >
            {tag}
          </button>
        ))}
      </div>
      <form className="room-list-form">
        <ul>
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => {
              const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers;
              return (
                <li key={room.name} className={`room-list-item${isFull ? " full" : ""}`}>
                  <div className="room-info-row">
                    <span className="room-title">{`Box ${room.name}`}</span>
                    <span className="room-users">
                      <span className="user-icon" role="img" aria-label="users">👤</span>
                      {room.userCount}/{room.maxUsers || "∞"}
                    </span>
                    <span className="room-lock">{room.hasPassword && <span className="room-lock">🔒</span>}</span>
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
                          <span
                            key={tag}
                            className={`room-tag tag-color-${tag.replace(/ /g, "-")}`}
                            data-tag={tag}
                          >
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
            <div className="room-list-empty">No rooms match your filter</div>
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
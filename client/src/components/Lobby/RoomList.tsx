import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";

interface Room {
  name: string;
  userCount: number;
  maxUsers?: number; // Lägg till maxUsers för att indikera maxgränsen
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
          {rooms.map((room, index) => {
            const isFull = room.maxUsers !== undefined && room.userCount >= room.maxUsers; // Kontrollera om rummet är fullt

            return (
              <li key={index}>
                <button
                  onClick={() => !isFull && onJoinRoom(room.name)} // Förhindra klick om rummet är fullt
                  className={`text-blue-600 hover:underline ${isFull ? "text-gray-400 cursor-not-allowed" : ""}`}
                  disabled={isFull} // Inaktivera knappen om rummet är fullt
                >
                  {room.name} ({room.userCount} user(s)
                  {room.maxUsers ? ` / ${room.maxUsers}` : ""})
                  {isFull && " - Full"} {/* Visa "Full" om rummet är fullt */}
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
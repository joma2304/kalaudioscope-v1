import React, { useState } from "react";

interface LobbyProps {
  onJoinRoom: (roomName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [roomName, setRoomName] = useState("");

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      onJoinRoom(roomName.trim());
    }
  };

  return (
    <div className="lobby-container">
      <h2>Lobby</h2>
      <div className="room-creation">
        <input
          type="text"
          placeholder="Ange rumsnamn"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={handleCreateRoom}>Skapa/Gå med i rum</button>
      </div>
    </div>
  );
};

export default Lobby;
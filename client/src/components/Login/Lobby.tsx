import React, { useState, useEffect } from "react";
import "./Lobby.css"; 

interface LobbyProps {
  onJoinRoom: (roomName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [roomName, setRoomName] = useState("");
  const [existingRooms, setExistingRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Funktion för att hämta befintliga lobbys från backend
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3500/api/rooms");
      if (response.ok) {
        const rooms = await response.json();
        console.log("Hämtade rum:", rooms);
        setExistingRooms(rooms);
      } else {
        console.error("Kunde inte hämta lobbys");
      }
    } catch (error) {
      console.error("Fel vid hämtning av lobbys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (roomName.trim()) {
      console.log("Skickar POST-förfrågan med roomName:", roomName.trim());
      try {
        const response = await fetch("http://localhost:3500/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomName: roomName.trim() }),
        });

        if (response.ok) {
          console.log("Rum skapat!");
          setRoomName(""); // Rensa inputfältet
          fetchRooms(); // Hämta den uppdaterade listan över rum
        } else {
          console.error("Kunde inte skapa rum");
        }
      } catch (error) {
        console.error("Fel vid skapande av rum:", error);
      }
    }
  };

  const handleJoinExistingRoom = (room: string) => {
    onJoinRoom(room);
  };

  return (
    <div className="lobby-container">
      <h2>Lobby</h2>

      {/* Skapa nytt rum */}
      <div className="room-creation">
        <input
          type="text"
          placeholder="Ange rumsnamn"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={handleCreateRoom}>Skapa/Gå med i rum</button>
      </div>

      {/* Lista över befintliga lobbys */}
      <div className="existing-rooms">
        <h3>Befintliga lobbys</h3>
        {loading ? (
          <p>Hämtar lobbys...</p>
        ) : existingRooms.length > 0 ? (
          <ul>
            {existingRooms.map((room) => (
              <li key={room}>
                <button onClick={() => handleJoinExistingRoom(room)}>
                  Gå med i {room}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Inga lobbys tillgängliga</p>
        )}
      </div>
    </div>
  );
};

export default Lobby;

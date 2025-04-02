import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const OnlyShow = () => {
  const [ticketNumber, setTicketNumber] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (ticketNumber.length !== 10) {
      alert("Biljettnumret måste vara exakt 10 siffror!");
      return;
    }

    console.log("Ansluter till föreställning med biljettnummer:", ticketNumber);

    // Navigera till föreställningsvyn och skicka biljettnumret som state
    navigate("/show", { state: { ticketNumber } });
  };

  return (
    <div>
      <h2>Se föreställningen enskilt utan chatt</h2>
      <input
        type="text"
        placeholder="Biljettnummer (10 siffror)"
        value={ticketNumber}
        onChange={(e) => {
          if (/^\d*$/.test(e.target.value)) {
            setTicketNumber(e.target.value);
          }
        }}
        maxLength={10}
        required
      />
      <button onClick={handleJoin}>Anslut utan chatt</button>
    </div>
  );
};

export default OnlyShow;
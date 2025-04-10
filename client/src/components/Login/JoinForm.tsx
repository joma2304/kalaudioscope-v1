import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./JoinForm.css";

const JoinForm = () => {
    const socket = useSocket();

    const [name, setName] = useState("");
    const [ticketNumber, setTicketNumber] = useState("");
    const [error, setError] = useState("");

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Du måste ange ett namn!");
            return;
        }

        if (ticketNumber.length !== 10) {
            setError("Biljettnumret måste vara exakt 10 siffror!");
            return;
        }

        const room = ticketNumber.slice(0, 4);

        localStorage.setItem("chatName", name);
        localStorage.setItem("chatRoom", room);
        localStorage.setItem("ticketNumber", ticketNumber);

        socket.emit("enterRoom", { name, room });

        // Ladda om sidan för att visa ChatApp
        window.location.reload();
    };

    return (
        <div className="join-form">
            <form onSubmit={joinRoom}>
                <input
                    type="text"
                    placeholder="Ditt namn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
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
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Anslut till föreställning</button>
            </form>
        </div>
    );
};

export default JoinForm;

import React, { useState } from "react";
import "./JoinForm.css";

const JoinForm = () => {

    const [name, setName] = useState("");
    const [room, setRoom] = useState("");
    const [error, setError] = useState("");

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Du måste ange ett namn!");
            return;
        }


        

        localStorage.setItem("chatName", name);
        localStorage.setItem("chatRoom", room);
        


        // Ladda om sidan för att visa ChatApp
        window.location.reload();
    };

    return (
        <div className="join-form">
            <form onSubmit={joinRoom}>
                <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Chat room"
                    value={room}
                    onChange={(e) => 
                        setRoom(e.target.value)}
                    required
                />
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Connect to show</button>
            </form>
        </div>
    );
};

export default JoinForm;

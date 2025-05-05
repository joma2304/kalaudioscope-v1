import React, { useState } from "react";
import "./JoinForm.css";

interface NameInputProps {
  name: string;
  setName: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ setName }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setName(input.trim());
  };

  return (
    <div className="name-input-box" style={{ marginBottom: "1.5rem" }}>
      <h2>Personal Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your name</label>
          <div className="name-input-wrapper">
            <input
              id="name"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
              className="name-input"
              autoComplete="off"
            />
            <span className="name-icon" role="img" aria-label="user">✏️</span>
          </div>
        </div>
        <button type="submit" className="create-room-btn" style={{ marginTop: 12 }}>
          Continue
        </button>
      </form>
    </div>
  );
};

export default NameInput;
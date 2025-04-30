import React from "react";
import "./NameInput.css"; // Assuming you have a CSS file for styling

interface NameInputProps {
  name: string;
  setName: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ name, setName }) => {
  return (
    <div className="name-input-container">
        <h2 className="name-input-title">Enter your name</h2>
        <p className="name-input-description">You must always enter your name, when creating a new room or joining an existing room.</p>
      <label className="name-input-label">Name:</label>
      <input
        className="name-input"
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
  );
};

export default NameInput;
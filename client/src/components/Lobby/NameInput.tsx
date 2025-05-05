import React, { useState } from "react";
import toast from "react-hot-toast";
import "./Nameinput.css";

interface NameInputProps {
  name: string;
  setName: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ setName }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      toast.error("Please enter your name!");
      return;
    }
    setName(input.trim());
  };

  return (
    <div className="name-input-container">
        <h2 className="name-input-title">Enter your name</h2>
      <form className="name-form" onSubmit={handleSubmit}>
          <label className="name-input-label">Name:</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="name-input"
            autoComplete="off"
          />
          <button type="submit" className="name-button" style={{ marginTop: 12 }}>
            Continue
          </button>
      </form>

    </div >
  );
};

export default NameInput;
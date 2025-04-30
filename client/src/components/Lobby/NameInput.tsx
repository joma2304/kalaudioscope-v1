import React from "react";
import "./JoinForm.css"; // Återanvänd gärna samma stil

interface NameInputProps {
  name: string;
  setName: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ name, setName }) => (
  <div className="join-form" style={{ marginBottom: "1.5rem" }}>
    <form>
      <div className="form-group">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
    </form>
  </div>
);

export default NameInput;
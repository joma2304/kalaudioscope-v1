import React from "react";
import "./JoinForm.css";

interface NameInputProps {
  name: string;
  setName: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ name, setName }) => (
  <div className="name-input-box" style={{ marginBottom: "1.5rem" }}>
    <h2>Personal Information</h2>
    <form>
      <div className="form-group">
        <label htmlFor="name">Your name</label>
        <div className="name-input-wrapper">
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="name-input"
            autoComplete="off"
          />
          <span className="name-icon" role="img" aria-label="user">✏️</span>
        </div>
      </div>
    </form>
  </div>
);

export default NameInput;
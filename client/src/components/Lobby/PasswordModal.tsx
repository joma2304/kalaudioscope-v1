import React from "react";
import "./PasswordModal.css";


interface PasswordModalProps {
  roomName: string;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  roomName,
  password,
  setPassword,
  onSubmit,
  onCancel,
}) => (
  <div className="password-modal-overlay">
    <div className="password-modal">
      <h3>Enter password for Box {roomName}</h3>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoFocus
        className="password-input"
        onKeyDown={e => {
          if (e.key === "Enter") onSubmit();
        }}
      />
      <div className="modal-actions">
        <button onClick={onSubmit} className="modal-btn">Join</button>
        <button onClick={onCancel} className="modal-btn cancel">Cancel</button>
      </div>
    </div>
  </div>
);

export default PasswordModal;
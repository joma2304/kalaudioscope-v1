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
  password,
  setPassword,
  onSubmit,
  onCancel,
}) => (
  <div className="password-modal-overlay">
    <div className="modal-content">
      <h3>Enter password</h3>
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
      <div className="modal-buttons">
        <button onClick={onSubmit} className="modal-submit-button">Join</button>
        <button onClick={onCancel} className="modal-cancel-button cancel">Cancel</button>
      </div>
    </div>
  </div>
);

export default PasswordModal;
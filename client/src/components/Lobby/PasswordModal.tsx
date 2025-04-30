import React, { useState } from "react";
import "./PasswordModal.css"; // Skapa en CSS-fil för modalens styling

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<boolean>; // Ändra till en Promise för att hantera fel
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Hantera felmeddelanden

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const success = await onSubmit(password); // Vänta på resultat från onSubmit
    if (!success) {
      setErrorMessage("Incorrect password. Please try again."); // Visa felmeddelande
    } else {
      setPassword(""); // Återställ lösenordet
      setErrorMessage(null); // Återställ felmeddelandet
      onClose(); // Stäng modalen
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(); // Anropa handleSubmit om "Enter" trycks
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Enter Room Password</h3>
        {errorMessage && <p className="modal-error-message">{errorMessage}</p>} {/* Visa felmeddelande */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown} // Lägg till onKeyDown-händelsen
          className="modal-input"
        />
        <div className="modal-buttons">
          <button onClick={handleSubmit} className="modal-submit-button">Submit</button>
          <button onClick={onClose} className="modal-cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
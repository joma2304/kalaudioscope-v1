import React, { useState } from "react";
import "./LoginModal.css";
import toast from "react-hot-toast";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegister: (user: { firstName: string; lastName: string; email: string; password: string }) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onRegister }) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !lastName || !email || !password) {
            toast.error("All fields are required.");
            return;
        }
        onRegister({ firstName, lastName, email, password });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Register</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            
                        />
                    </div>
                    <div className="form-group">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            
                        />
                    </div>
                    <button type="submit" className="primary-btn">Register</button>
                    <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default RegisterModal;
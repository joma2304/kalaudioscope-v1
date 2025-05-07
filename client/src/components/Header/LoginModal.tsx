import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import "./LoginModal.css"; // Importera CSS-filen

interface Props {
  open: boolean;
  onClose: () => void;
  setIsLoggedIn: (val: boolean) => void;
  setUserId: (id: string) => void;
}

const LoginModal: React.FC<Props> = ({ open, onClose, setIsLoggedIn, setUserId }) => {
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    const res = await fetch("http://localhost:3500/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setUser({
        userId: data.user.id,
        token: data.token,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
      });
      setIsLoggedIn(true);
      setUserId(data.user.id);
      onClose();
    } else {
      setError(data.message || "Login failed");
    }
  };

  return (
    <div className="modal-overlay">
    <div className="modal-content">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            className="login-form-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            className="login-form-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="primary-btn">Login</button>
        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
      </form>
    </div>
  </div>
  );
};

export default LoginModal;
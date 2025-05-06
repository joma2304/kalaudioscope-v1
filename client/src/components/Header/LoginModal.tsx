import React, { useState } from "react";
import { useUser } from "../../context/UserContext";

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
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 8, minWidth: 320 }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
          <button type="submit" style={{ width: "100%", padding: 10, marginBottom: 8 }}>Login</button>
          <button type="button" onClick={onClose} style={{ width: "100%", padding: 10, background: "#eee" }}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
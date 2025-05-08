import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import "./Header.css";
import toast from "react-hot-toast";

interface HeaderProps {
  setIsLoggedIn: (val: boolean) => void;
  setUserId: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsLoggedIn, setUserId }) => {
  const { user, logout } = useUser();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleRegister = async (user: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      const res = await fetch("http://localhost:3500/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Registration successful! You can now log in.");
        setShowRegister(false);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <header className="header">
      <div className="header-title">Opera Chat</div>
      <div className="header-user">
        {user ? (
          <>
            <span className="user-info">
              {user.firstName} {user.lastName} ({user.email})
            </span>
            <button className="logout-btn" onClick={() => {
              logout();
              setIsLoggedIn(false);
              setUserId("");
            }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              Login
            </button>
            <button className="register-btn" onClick={() => setShowRegister(true)}>
              Register
            </button>
            <LoginModal
              open={showLogin}
              onClose={() => setShowLogin(false)}
              setIsLoggedIn={setIsLoggedIn}
              setUserId={setUserId}
            />
            <RegisterModal
              isOpen={showRegister}
              onClose={() => setShowRegister(false)}
              onRegister={handleRegister}
            />
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
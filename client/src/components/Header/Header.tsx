import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import "./Header.css";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";

interface HeaderProps {
  setIsLoggedIn: (val: boolean) => void;
  setUserId: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsLoggedIn, setUserId }) => {
  const { user, logout } = useUser();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      <a href="/" className="header-logo-link">
        <img
          src="/kalaudioscope-logo-small.png"
          alt="Kalaudioscope Logo"
          className="header-logo"
        />
      </a>
      <button
        className={`hamburger${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`header-user${menuOpen ? " open" : ""}`}>
        {user ? (
          <>
            <span className="user-info">
              {user.firstName} {user.lastName}
              <br className="user-break" />
              <span className="user-email">({user.email})</span>
            </span>
            <div className="settings-icon">
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Account settings"
              >
                <Settings size={22} className="settings-icon-svg" />
              </button>
            </div>
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              onLogout={() => {
                logout();
                setIsLoggedIn(false);
                setUserId("");
              }}
            />
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

import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import LoginModal from "./LoginModal";
import "./Header.css";

interface HeaderProps {
  setIsLoggedIn: (val: boolean) => void;
  setUserId: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsLoggedIn, setUserId }) => {
  const { user, logout } = useUser();
  const [showLogin, setShowLogin] = useState(false);

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
          <LoginModal
            open={showLogin}
            onClose={() => setShowLogin(false)}
            setIsLoggedIn={setIsLoggedIn}
            setUserId={setUserId}
          />
        </>
      )}
    </div>
  </header>
  );
};

export default Header;
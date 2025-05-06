import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import LoginModal from "./LoginModal";

interface HeaderProps {
  setIsLoggedIn: (val: boolean) => void;
  setUserId: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsLoggedIn, setUserId }) => {
  const { user, logout } = useUser();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header style={{ padding: "1em", background: "#222", color: "#fff", display: "flex", justifyContent: "space-between" }}>
      <div>
        <strong>Opera Chat</strong>
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>
              {user.firstName} {user.lastName} ({user.email})
            </span>
            <button onClick={() => { logout(); setIsLoggedIn(false); setUserId(""); }} style={{ padding: "0.4em 1em" }}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => setShowLogin(true)} style={{ padding: "0.4em 1em" }}>Login</button>
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
import React, { createContext, useContext, useState } from "react";

export interface User {
  userId: string;
  token: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => { },
  logout: () => { },
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(
    () => {
      const stored = localStorage.getItem("authUser");
      return stored ? JSON.parse(stored) : null;
    }
  );

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
  };

  return (
    <UserContext.Provider value={{
      user, setUser: (u) => {
        setUser(u);
        if (u) localStorage.setItem("authUser", JSON.stringify(u));
        else localStorage.removeItem("authUser");
      }, logout
    }}>
      {children}
    </UserContext.Provider>
  );
};
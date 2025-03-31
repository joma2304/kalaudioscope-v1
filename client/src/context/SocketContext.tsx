import { createContext, useContext } from "react";
import { io } from "socket.io-client";

const socket = io("ws://localhost:3500");

export const SocketContext = createContext(socket);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
);

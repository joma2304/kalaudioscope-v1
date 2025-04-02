import { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("ws://localhost:3500", { autoConnect: false });

export const SocketContext = createContext(socket);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        console.log("Connecting socket...");
        socket.connect();

        socket.on("connect", () => {
            console.log("Connected to server with ID:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });
    

        return () => {
            console.log("Disconnecting socket...");
            socket.disconnect();
        };
    }, []);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

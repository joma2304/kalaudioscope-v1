import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://kalaudioscope-test.onrender.com", { autoConnect: false });

export const SocketContext = createContext(socket);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            setConnected(true);
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {connected ? children : <div>Connecting to server...</div>}
        </SocketContext.Provider>
    );
};

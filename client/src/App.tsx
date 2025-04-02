import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/ChatApp";
import "./App.css";

const App = () => {
    return (
        <SocketProvider>
            <ChatApp />
        </SocketProvider>
    );
};

export default App;
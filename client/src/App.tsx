import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/ChatApp";

const App = () => {
    return (
        <SocketProvider>
            <ChatApp />
        </SocketProvider>
    );
};

export default App;
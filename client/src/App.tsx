import ChatApp from "./components/ChatApp";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
    return (
        <SocketProvider>
            <ChatApp />
        </SocketProvider>
    );
};

export default App;


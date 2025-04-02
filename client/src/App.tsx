import ChatApp from "./components/ChatApp";
import OnlyShow from "./components/OnlyShow";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
    return (
        <SocketProvider>
            <OnlyShow />
            <ChatApp />
        </SocketProvider>
    );
};

export default App;


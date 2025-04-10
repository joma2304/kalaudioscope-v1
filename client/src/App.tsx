import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/ChatApp";
import "./App.css";
import VideoParent from "./components/VideoParent";


const App = () => {
    return (
        <SocketProvider>

            <ChatApp />
            <VideoParent />
            
        </SocketProvider>
    );
};

export default App;
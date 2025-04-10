import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import "./ChatApp.css";
import { LogOut, SendHorizonal, CircleX, MessageSquareIcon } from "lucide-react";


import JoinForm from "./JoinForm";
import MessageList from "./ChatContainer/MessageList";
import MessageForm from "./ChatContainer/MessageForm";
import UserList from "./ChatContainer/UserList";
import ActivityIndicator from "./ChatContainer/ActivityIndicator";
import LeaveChatButton from "./ChatContainer/LeaveChatButton";
// import MockStream from "./MockStream";

import TestMovableDiv from "./testMovableDiv";
import  { sendMessageToServer } from "./SendMessageToServer";


interface Message {
    name: string;
    text: string;
    time: string;
}

const ChatApp = () => {
    const socket = useSocket();
    const [name, setName] = useState("");
    const [ticketNumber, setTicketNumber] = useState("");
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [activity, setActivity] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastLeftTime, setLastLeftTime] = useState<number | null>(null); // Tidsstämpel för senaste lämning
    const [hasLeft, setHasLeft] = useState(false); // För att hålla reda på om användaren lämnat via knappen
    const [error, setError] = useState(""); // För felmeddelanden
    const [displayChat, setDisplayChat] = useState(true); // För att visa eller dölja chattfönstret


    // Funktioner för att hantera inloggning och anslutning till rummet
    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
        const storedTicketNumber = localStorage.getItem("ticketNumber");

        if (storedName && storedRoom) {
            setName(storedName);
            setRoom(storedRoom);
            setTicketNumber(storedTicketNumber || ""); // Sätt ticketNumber från localStorage


            socket.emit("enterRoom", { name: storedName, room: storedRoom });

            setShowChat(true);
            setShowHeader(false);

            // Kontrollera om användaren lämnat nyligen, och hantera eventuellt meddelande
            if (lastLeftTime && Date.now() - lastLeftTime < 60000) {
                setHasLeft(false); // Om senaste lämning var mindre än 1 minut, ignorera lämning/återanslut
            }
        }

        const handleMessage = (data: Message) => {
            setMessages((prev) => [...prev, data]);
            setActivity("");
        };

        const handleUserList = ({ users }: { users: { name: string }[] }) => {
            setUsers(users.map((user) => user.name));
        };

        const handleActivity = (name: string | null) => {
            setActivity(name ? `${name} skriver...` : "");
        };

        socket.on("message", handleMessage);
        socket.on("userList", handleUserList);
        socket.on("activity", handleActivity);

        return () => {
            socket.off("message", handleMessage);
            socket.off("userList", handleUserList);
            socket.off("activity", handleActivity);
        };
    }, [socket, lastLeftTime]);

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Du måste ange ett namn!");
            return;
        }

        if (ticketNumber.length !== 10) {
            setError("Biljettnumret måste vara exakt 10 siffror!");
            return;
        }

        const room = ticketNumber.slice(0, 4); // De första 4 siffrorna avgör rummet

        // Spara i localStorage
        localStorage.setItem("chatName", name);
        localStorage.setItem("chatRoom", room);
        localStorage.setItem("ticketNumber", ticketNumber); // Spara ticketNumber i localStorage

        console.log("Joining room:", { name, room }); // Logga room här!


        // Skicka anslutningshändelse till servern
        socket.emit("enterRoom", { name, room });
        setRoom(room); // Säkerställ att room sätts här

        setShowChat(true);
        setShowHeader(false);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && name) {
            await sendMessageToServer({
                name,
                text: message,
                socket,
            });
            setMessage("");
        }
    };
    


    function leaveChat() {
        console.log("Leaving room:", { name, room }); // Lägg till denna logg

        if (!room) {
            console.error("Room is empty, cannot leave!");
            return;
        }

        socket.emit("leaveRoom", { name, room });

        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");
        localStorage.removeItem("ticketNumber");

        setMessages([]);
        setUsers([]);
        setActivity("");
        setShowChat(false);
        setShowHeader(true);
        setName("");
        setRoom("");
        setTicketNumber("");

        // Spara senaste lämningstid och markera att användaren lämnat
        setLastLeftTime(Date.now());
        setHasLeft(true);
    }

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTyping = () => {
        if (!isTyping) {
            socket.emit("activity", name);
            setIsTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("activity", null);
            setIsTyping(false);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <>
            <div><TestMovableDiv/>

                <div className="toggle-chat-container">
                    {showChat && (
                        <button onClick={() => setDisplayChat(!displayChat)} className="toggle-chat">
                            {displayChat ? (
                                <> <CircleX /></>
                            ) : (
                                <><MessageSquareIcon />Visa chatt</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {displayChat && (
                <div>
                    {showHeader && (
                        <JoinForm
                            name={name}
                            setName={setName}
                            ticketNumber={ticketNumber}
                            setTicketNumber={setTicketNumber}
                            joinRoom={joinRoom}
                            error={error}
                        />
                    )}

                    {!showChat && !showHeader && <p>Ansluter till rummet...</p>}

                    {showChat && (
                        <>
                            <div className="chat-container" >
                                <MessageList messages={messages} name={name} chatRef={chatRef} roomId={""} />
                                <ActivityIndicator activity={activity} />
                                <MessageForm
                                    message={message}
                                    setMessage={setMessage}
                                    sendMessage={sendMessage}
                                    handleTyping={handleTyping}
                                />
                                <UserList users={users} />
                                <LeaveChatButton leaveChat={leaveChat} />
                            </div>
                            
                        </>
                    )}
                    
                </div>
                
            )}
        </>
    );
};

export default ChatApp;
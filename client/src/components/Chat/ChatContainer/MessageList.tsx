import MessageHistory from "./MessageList/MessageHistory";
import React from "react";

interface Message {
    name: string;
    text: string;
    time: string;
}

interface MessageListProps {
    messages: Message[];
    name: string;
    chatRef?: React.RefObject<HTMLDivElement | null>;
    roomId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, name, chatRef, roomId }) => {
    return (
        <div className="chat-display" ref={chatRef}>
            <div className="chat-title">Välkommen!</div>

            <MessageHistory roomId={roomId} />

            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`post ${msg.name === "Admin"
                        ? "post--system"
                        : msg.name === name
                            ? "post--right"
                            : "post--left"
                        }`}
                >
                    <span className="sender">{msg.name !== "Admin" && <strong>{msg.name} <hr /></strong>}</span>
            
                    <span className="msg">{msg.text}</span>
                    <em className="sent-time">{msg.time}</em>
                </div>
            ))}
        </div>
    );
};

export default MessageList;
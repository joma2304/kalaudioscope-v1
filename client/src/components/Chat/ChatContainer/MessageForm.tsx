import { SendHorizonal } from "lucide-react";

interface MessageFormProps {
    message: string;
    setMessage: (value: string) => void;
    sendMessage: (e: React.FormEvent) => void;
    handleTyping: () => void;
}

const MessageForm: React.FC<MessageFormProps> = ({ message, setMessage, sendMessage, handleTyping }) => {
    return (
        <form onSubmit={sendMessage} className="message-form">
            <input
                className="message-input"
                type="text"
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleTyping}
                required
            />
            <button className="send-button" type="submit">
                <SendHorizonal size={18} className="send-message-icon" /> Send
            </button>
        </form>
    );
};

export default MessageForm;
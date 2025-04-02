import { LogOut } from "lucide-react";

interface LeaveChatButtonProps {
    leaveChat: () => void;
}

const LeaveChatButton: React.FC<LeaveChatButtonProps> = ({ leaveChat }) => {
    return (
        <button onClick={leaveChat} className="leave-chat">
            <LogOut size={18} /> <span>Lämna rummet</span>
        </button>
    );
};

export default LeaveChatButton;
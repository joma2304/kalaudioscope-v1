import React from "react";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import "./CopyInviteLinkButton.css"; // Importera CSS för knappen

interface CopyInviteLinkButtonProps {
    room: string;
    password?: string; // Lägg till lösenord som en valfri prop
}

const CopyInviteLinkButton: React.FC<CopyInviteLinkButtonProps> = ({ room, password }) => {
    const handleCopy = () => {
        const url = `${window.location.origin}?room=${encodeURIComponent(room)}${password ? `&password=${encodeURIComponent(password)}` : ""
            }`;
        navigator.clipboard.writeText(url);
        toast.success("Invite link copied!");
    };

    return (
        <div className="copy-invite-wrapper">
            <button className="create-room-btn" onClick={handleCopy}>
                <Copy size={16} className="copy-icon" />
                Copy invite link
            </button>
        </div>

    );
};

export default CopyInviteLinkButton;
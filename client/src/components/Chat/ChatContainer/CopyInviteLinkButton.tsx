import React from "react";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import "./CopyInviteLinkButton.css";

interface CopyInviteLinkButtonProps {
  room: string;
  password?: string;
}

const CopyInviteLinkButton: React.FC<CopyInviteLinkButtonProps> = ({ room, password }) => {
  const handleCopy = () => {
    let url = `${window.location.origin}?room=${encodeURIComponent(room)}`;
    if (password) {
      url += `&password=${encodeURIComponent(password)}`;
    }
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  return (
    <div className="copy-invite-wrapper">
    <button className="copy-room-btn" onClick={handleCopy}>
        <Copy size={16} className="copy-icon" />
        Copy invite link
    </button>
</div>
  );
};

export default CopyInviteLinkButton;
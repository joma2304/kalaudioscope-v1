import React from "react";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

interface CopyInviteLinkButtonProps {
  room: string;
}

const CopyInviteLinkButton: React.FC<CopyInviteLinkButtonProps> = ({ room }) => {
  const handleCopy = () => {
    const url = `${window.location.origin}?room=${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "0.7em" }}>
      <button className="create-room-btn" onClick={handleCopy}>
        <Copy size={16} style={{ marginRight: 6, marginBottom: -2 }} />
        Copy invite link
      </button>
    </div>
  );
};

export default CopyInviteLinkButton;
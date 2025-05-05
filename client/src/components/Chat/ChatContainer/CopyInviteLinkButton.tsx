import React from "react";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

interface CopyInviteLinkButtonProps {
  room: string;
  password?: string; // Lägg till lösenord som en valfri prop
}

const CopyInviteLinkButton: React.FC<CopyInviteLinkButtonProps> = ({ room, password }) => {
  const handleCopy = () => {
    const url = `${window.location.origin}?room=${encodeURIComponent(room)}${
      password ? `&password=${encodeURIComponent(password)}` : ""
    }`;
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
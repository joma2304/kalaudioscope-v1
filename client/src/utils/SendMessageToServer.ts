export const sendMessageToServer = async ({
    userId,
    text,
    socket,
}: {
    userId: string;
    text: string;
    socket: any;
}) => {
    if (!userId || !text) return;

    socket.emit("message", { userId, text });

    try {
        const res = await fetch("http://localhost:3500/api/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                text,
                roomId: localStorage.getItem("chatRoom"),
            }),
        });

        if (!res.ok) {
            throw new Error("Något gick fel med att skicka meddelandet till databasen.");
        }

        const data = await res.json();
        console.log("Meddelande skickat till databasen:", data);
    } catch (error) {
        console.error("Fel vid skick till databasen:", error);
    }
};

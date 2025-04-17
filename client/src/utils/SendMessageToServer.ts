export const sendMessageToServer = async ({
    name,
    text,
    socket,
}: {
    name: string;
    text: string;
    socket: any;
}) => {
    if (!name || !text) return;

    socket.emit("message", { name, text });

    try {
        const res = await fetch("http://localhost:3500/api/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
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

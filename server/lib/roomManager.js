import User from "../models/user.model.js"; //

// state för att hantera användare
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray;
    }
};

//Funktion för att skapa ett meddelande 
async function buildMsg(userId, text) {
    if (userId === "Admin") {
        return {
            userId,
            firstName: "Admin",
            lastName: "",
            text: text || "System message", // Fallback för text
            time: new Intl.DateTimeFormat('default', {
                hour: 'numeric',
                minute: 'numeric',
                hourCycle: 'h23' // Använd 24-timmarsformat
            }).format(new Date())
        };
    }
    // Hämta namn från databasen
    const user = await User.findById(userId).lean();
    return {
        userId,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23' // Använd 24-timmarsformat
        }).format(new Date())
    };
}

function activateUser(id, userId, room) {
    const existingController = UsersState.users.find(user => user.room === room && user.isController);

    const user = {
        id, // socket.id
        userId, // Använd userId istället för name
        room,
        isController: !existingController // Första användaren i rummet blir controller
    };

    UsersState.setUsers([
        ...UsersState.users.filter((user) => user.id !== id),
        user,
    ]);

    console.log("Aktiverad användare:", user); // Debugga användarlistan

    return user;
}

function userLeavesApp(id, transferControl = true) {
    const user = getUser(id);
    if (!user) return null;

    let newController = null;

    if (user.isController && transferControl) {
        const nextUser = UsersState.users.find(u => u.room === user.room && u.id !== user.id);
        if (nextUser) {
            nextUser.isController = true;
            newController = nextUser;
        }
    }

    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    );

    console.log("Användare lämnade:", id); // Debugga användarlistan

    return newController;
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}

const getUsersInRoom = (room) => {
    return UsersState.users.filter(user => user.room === room).map(user => ({
        id: user.id, // Lägg till socket.id
        userId: user.userId, // Returnera userId istället för name
        isController: user.isController
    }));
};

function getAllActiveRooms() {
    // Kontrollera att UsersState innehåller användare
    if (UsersState.users.length === 0) {
        console.warn("Inga användare i UsersState, inga aktiva rum.");
    }
    return Array.from(new Set(UsersState.users.map(user => user.room)));
}

export {
    UsersState,
    buildMsg,
    activateUser,
    userLeavesApp,
    getUser,
    getUsersInRoom,
    getAllActiveRooms,
};
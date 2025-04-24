// state för att hantera användare
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray;
    }
};

// Funktion för att skapa ett meddelande 
function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23'
        }).format(new Date())
    };
}

function activateUser(id, name, room) {
    const existingController = UsersState.users.find(user => user.room === room && user.isController);

    const user = {
        id,
        name,
        room,
        isController: !existingController
    };

    UsersState.setUsers([
        ...UsersState.users.filter((user) => user.id !== id),
        user,
    ]);

    console.log(UsersState.users);  // Lägg till för att debugga användarlistan

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

    return newController;
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}

const getUsersInRoom = (room) => {
    return UsersState.users.filter(user => user.room === room);
};

function getAllActiveRooms() {
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

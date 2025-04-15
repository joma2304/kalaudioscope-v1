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
            hourCycle: 'h23' // Använd 24-timmarsformat
        }).format(new Date())
    };
}

// Funktion för att aktivera en användare
function activateUser(id, name, room) {
    // Kolla om det finns någon användare som redan är kontrollansvarig
    const existingController = UsersState.users.find(user => user.room === room && user.isController);

    const user = {
        id,
        name,
        room,
        isController: !existingController // Ge kontrollen till den första användaren i rummet
    };

    UsersState.setUsers([
        ...UsersState.users.filter((user) => user.id !== id),
        user,
    ]);

    return user;
}

function userLeavesApp(id, transferControl = true) {
    const user = getUser(id);
    if (!user) {
        console.log(`User ${id} not found in UsersState`);
        return;
    }

    // Om användaren var kontrollansvarig och transferControl är true, ge kontrollen till en annan användare
    if (user.isController && transferControl) {
        const nextUser = UsersState.users.find(u => u.room === user.room && u.id !== user.id);
        if (nextUser) {
            nextUser.isController = true; // Ge kontrollen till nästa användare
            console.log(`User ${nextUser.name} is now the controller`);
        }
    }

    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    );
    console.log(`User removed: ${JSON.stringify(user)}`);
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room);
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)));
}

// Exportera funktionerna och state
export {
    UsersState,
    buildMsg,
    activateUser,
    userLeavesApp,
    getUser,
    getUsersInRoom,
    getAllActiveRooms,
};

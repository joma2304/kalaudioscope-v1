// state för att hantera användare
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}

//Funktion för att skapa ett meddelande 
function buildMsg(userId, text) {
    return {
        userId,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23' // Använd 24-timmarsformat
        }).format(new Date())
    }
}

// Funktion för att aktivera en användare
function activateUser(id, userId, room) {
    const user = { id, userId, room };
    UsersState.setUsers([
        ...UsersState.users.filter((user) => user.id !== id),
        user,
    ]);
    return user;
}

function userLeavesApp(id) {
    const user = getUser(id);
    if (!user) {
        console.log(`User ${id} not found in UsersState`);
        return;
    }

    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    );
    console.log(`User removed: ${JSON.stringify(user)}`);
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
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
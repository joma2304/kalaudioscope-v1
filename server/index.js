import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

// state 
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173", "http://127.0.0.1:5173"]
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    // Användaren ansluter till ett rum
    socket.on('enterRoom', ({ name, room }) => {
        const existingUser = UsersState.users.find(u => u.name === name && u.room === room);
    
        if (existingUser) {
            console.log(`User ${name} refreshed in room ${room}, skipping duplicate message`);
            socket.join(room);
            return; // Användaren är redan i rummet, så vi undviker dubbla meddelanden
        }
    
        const prevUser = getUser(socket.id);
        if (prevUser) {
            const prevRoom = prevUser.room;
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${prevUser.name} har lämnat rummet`));
            io.to(prevRoom).emit('userList', { users: getUsersInRoom(prevRoom) });
        }
    
        const user = activateUser(socket.id, name, room);
        socket.join(user.room);
    
        socket.emit('message', buildMsg(ADMIN, `Ansluten till rum ${user.room}`));
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} har gått med i rummet`));
    
        io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) });
        io.emit('roomList', { rooms: getAllActiveRooms() });
    });


    // När användaren kopplar bort sig
    socket.on('disconnect', () => {
        const user = getUser(socket.id);

        if (!user) {
            console.log(`User ${socket.id} already removed`);
            return; // Användaren är redan borttagen
        }

        userLeavesApp(socket.id);

        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} har lämnat rummet`));
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room),
        });

        io.emit('roomList', {
            rooms: getAllActiveRooms(),
        });

        console.log(`User ${socket.id} disconnected`);
    });

    // När användaren lämnar ett rum
    socket.on('leaveRoom', ({ name, room }) => {
        const user = getUser(socket.id);

        if (user) {
            userLeavesApp(socket.id);
            socket.leave(room);

            io.to(room).emit('message', buildMsg(ADMIN, `${name} har lämnat rummet`));
            io.to(room).emit('userList', {
                users: getUsersInRoom(room),
            });

            console.log(`User ${name} left room ${room}`);
        }
    });

    // När ett meddelande skickas
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room
        if (room) {
            io.to(room).emit('message', buildMsg(name, text))
        }
    });

    // När en användare skriver
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room
        if (room) {
            socket.broadcast.to(room).emit('activity', name)
        }
    });
});

// Hjälpfunktioner

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

function activateUser(id, name, room) {
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
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

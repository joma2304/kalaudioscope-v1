import { Server } from "socket.io";
import http from "http";
import express from "express";
import {
    UsersState,
    buildMsg,
    activateUser,
    userLeavesApp,
    getUser,
    getUsersInRoom,
    getAllActiveRooms,
} from "./roomManager.js";

const app = express();
const server = http.createServer(app);

const ADMIN = "Admin";

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173", "http://127.0.0.1:5173"]
    }
});

const roomControllers = {};
const roomMaxLimits = {};
const roomPasswords = {};
const roomTags = {};

function emitRoomList() {
    io.emit("roomList", getAllActiveRooms().map(room => ({
        name: room,
        userCount: getUsersInRoom(room).length,
        maxUsers: roomMaxLimits[room] || null,
        hasPassword: !!roomPasswords[room],
        tags: roomTags[room] || [],
    })));
}

function handleControllerChange(room) {
    const remainingUsers = getUsersInRoom(room);
    if (remainingUsers.length > 0) {
        const newController = remainingUsers[0];
        newController.isController = true;
        roomControllers[room] = newController.id;
        io.to(room).emit('message', buildMsg(ADMIN, `${newController.name} is now in control.`));
        io.to(newController.id).emit('youAreNowController');
    } else {
        delete roomControllers[room];
    }
}

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    socket.on("requestRoom", ({ userId, maxUsers, password, tags }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";
        while (existingRooms.includes(roomName)) {
            roomName = (parseInt(roomName) + 1).toString();
        }

        if (maxUsers) roomMaxLimits[roomName] = maxUsers;
        if (typeof password === "string" && password.length > 0) {
            roomPasswords[roomName] = password;
        } else {
            delete roomPasswords[roomName];
        }
        roomTags[roomName] = Array.isArray(tags) ? tags : [];

        callback({ success: true, roomName });
        emitRoomList();
    });

    socket.on('enterRoom', ({ userId, room, password }, callback = () => {}) => {
        const currentUsers = getUsersInRoom(room).length;
        const maxUsers = roomMaxLimits[room];

        if (maxUsers && currentUsers >= maxUsers) {
            return callback({ success: false, message: "Room is full." });
        }
        if (roomPasswords[room] && roomPasswords[room] !== password) {
            return callback({ success: false, message: "Incorrect password." });
        }

        const existingUser = UsersState.users.find(u => u.name === userId && u.room === room);
        if (existingUser) {
            socket.join(room);
            return callback({
                success: true,
                message: "Reconnected to the room.",
                users: getUsersInRoom(room)
            });
        }

        const user = activateUser(socket.id, userId, room);
        socket.join(room);
        const users = getUsersInRoom(room);

        io.to(room).emit('userList', { users });
        io.to(room).emit('message', buildMsg(ADMIN, `${userId} has joined`));
        emitRoomList();

        if (!roomControllers[room] || roomControllers[room] === socket.id) {
            roomControllers[room] = socket.id;
            socket.emit('youAreNowController');
        }

        const state = getUser(socket.id);
        if (state) {
            socket.emit('initialState', {
                currentTime: state.videoTime || 0,
                isPlaying: state.isPlaying || false
            });
        }

        callback({
            success: true,
            message: "Joined the room successfully.",
            users
        });
    });

    socket.on("setRoomLimit", ({ room, maxUsers }, callback) => {
        const user = getUser(socket.id);
        if (!user || user.room !== room) {
            return callback({ success: false, message: "You are not in this room." });
        }
        if (maxUsers <= 0) {
            return callback({ success: false, message: "Max users must be greater than 0." });
        }
        roomMaxLimits[room] = maxUsers;
        callback({ success: true, message: `Max user limit set to ${maxUsers} for room ${room}.` });
    });

    socket.on("getRoomList", () => {
        emitRoomList();
    });

    socket.on('leaveRoom', ({ userId, room }) => {
        const user = getUser(socket.id);
        if (!user) return;

        userLeavesApp(socket.id);
        socket.leave(room);
        io.to(room).emit('message', buildMsg(ADMIN, `${userId} has left`));
        io.to(room).emit('userList', { users: getUsersInRoom(room) });

        if (user.isController) handleControllerChange(room);
        if (getUsersInRoom(room).length === 0) {
            delete roomPasswords[room];
            delete roomMaxLimits[room];
        }

        emitRoomList();
    });

    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        if (!user) return;

        userLeavesApp(socket.id);
        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left`));
        io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) });

        if (user.isController) handleControllerChange(user.room);
        emitRoomList();

        console.log(`User ${socket.id} disconnected`);
    });

    socket.on('message', ({ userId, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(userId, text));
        }
    });

    socket.on('activity', userId => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', userId);
        }
    });

    socket.on('syncTime', time => {
        const user = getUser(socket.id);
        if (user?.isController) {
            user.videoTime = time;
            socket.broadcast.to(user.room).emit('syncTime', time);
        }
    });

    socket.on('togglePlayPause', isPlaying => {
        const user = getUser(socket.id);
        if (user?.isController) {
            user.isPlaying = isPlaying;
            socket.broadcast.to(user.room).emit('togglePlayPause', isPlaying);
        }
    });
});

export { io, app, server };

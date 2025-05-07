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
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const ADMIN = "Admin";

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173", "http://127.0.0.1:5173"]
    }
});

// Rumsrelaterad state
const roomControllers = {};   // room: socketId
const roomMaxLimits = {};     // room: number
const roomPasswords = {};     // room: string
const roomTags = {};          // room: string[]
const roomCleanupTimers = {}; // room: timeout

function emitRoomList() {
    io.emit("roomList", getAllActiveRooms().map(room => ({
        name: room,
        userCount: getUsersInRoom(room).length,
        maxUsers: roomMaxLimits[room] || null,
        hasPassword: !!roomPasswords[room],
        tags: roomTags[room] || [],
    })));
}

async function handleControllerChange(room) {
    const remainingUsers = getUsersInRoom(room);
    if (remainingUsers.length > 0) {
        const newController = remainingUsers[0];
        newController.isController = true;
        roomControllers[room] = newController.id;

        const userDoc = await User.findById(newController.userId).lean();
        const name = userDoc ? `${userDoc.firstName} ${userDoc.lastName}` : newController.userId;

        io.to(room).emit('message', await buildMsg(ADMIN, `${name} is now in control.`));
        io.to(newController.id).emit('youAreNowController');
    } else {
        delete roomControllers[room];
    }
}

io.on("connection", (socket) => {
    console.log(`User ${socket.id} connected`);

    socket.on("requestRoom", ({ maxUsers, password, tags }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";
        while (existingRooms.includes(roomName)) roomName = (parseInt(roomName) + 1).toString();

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

    socket.on("enterRoom", async ({ userId, room, password }, callback = () => {}) => {
        const currentUsers = getUsersInRoom(room).length;

        if (roomMaxLimits[room] && currentUsers >= roomMaxLimits[room]) {
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

        const usersInRoom = getUsersInRoom(room);
        const users = await Promise.all(
            usersInRoom.map(async (u) => {
                const userDoc = await User.findById(u.userId).lean();
                return {
                    userId: u.userId,
                    firstName: userDoc?.firstName || "",
                    lastName: userDoc?.lastName || ""
                };
            })
        );

        io.to(room).emit("userList", { users });

        const joinedUser = await User.findById(userId).lean();
        const joinedName = joinedUser ? `${joinedUser.firstName} ${joinedUser.lastName}` : userId;
        io.to(room).emit("message", await buildMsg(ADMIN, `${joinedName} has joined`));
        emitRoomList();

        if (!roomControllers[room] || roomControllers[room] === socket.id) {
            roomControllers[room] = socket.id;
            user.isController = true;
            socket.emit("youAreNowController");
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


    socket.on("leaveRoom", async ({ userId, room }) => {
        const user = getUser(socket.id);
        if (!user) return;

        userLeavesApp(socket.id);
        socket.leave(room);

        const leftUser = await User.findById(userId).lean();
        const leftName = leftUser ? `${leftUser.firstName} ${leftUser.lastName}` : userId;
        io.to(room).emit("message", await buildMsg(ADMIN, `${leftName} has left the chat`));

        const usersInRoom = getUsersInRoom(room);
        const users = await Promise.all(
            usersInRoom.map(async (u) => {
                const userDoc = await User.findById(u.userId).lean();
                return {
                    userId: u.userId,
                    firstName: userDoc?.firstName || "",
                    lastName: userDoc?.lastName || ""
                };
            })
        );

        io.to(room).emit("userList", { users });

        if (user.isController) await handleControllerChange(room);

        if (usersInRoom.length === 0) {
            delete roomPasswords[room];
            delete roomMaxLimits[room];
            delete roomControllers[room];
            delete roomTags[room];
        }

        emitRoomList();
    });

    socket.on("disconnect", async () => {
        const user = getUser(socket.id);
        if (!user) return;

        userLeavesApp(socket.id);

        const discUser = await User.findById(user.userId).lean();
        const discName = discUser ? `${discUser.firstName} ${discUser.lastName}` : user.userId;
        io.to(user.room).emit("message", await buildMsg(ADMIN, `${discName} has left the chat`));

        const usersInRoom = getUsersInRoom(user.room);
        const users = await Promise.all(
            usersInRoom.map(async (u) => {
                const userDoc = await User.findById(u.userId).lean();
                return {
                    userId: u.userId,
                    firstName: userDoc?.firstName || "",
                    lastName: userDoc?.lastName || ""
                };
            })
        );

        io.to(user.room).emit("userList", { users });

        if (user.isController) await handleControllerChange(user.room);

        emitRoomList();
        console.log(`User ${socket.id} disconnected`);
    });

    socket.on("message", async ({ userId, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            const msg = await buildMsg(userId, text);
            io.to(room).emit("message", msg);
        }
    });

    socket.on("activity", (userId) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit("activity", userId);
        }
    });

    socket.on("syncTime", (time) => {
        const user = getUser(socket.id);
        if (user?.isController) {
            user.videoTime = time;
            socket.broadcast.to(user.room).emit("syncTime", time);
        }
    });

    socket.on("togglePlayPause", (isPlaying) => {
        const user = getUser(socket.id);
        if (user?.isController) {
            user.isPlaying = isPlaying;
            socket.broadcast.to(user.room).emit("togglePlayPause", isPlaying);
        }
    });
});

export { io, app, server };

import { Server } from "socket.io";
import http from "http";
import express from "express";
import {
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

// Room state
const roomControllers = {};
const roomMaxLimits = {};
const roomPasswords = {};
const roomTags = {};

const emitRoomList = () => {
    io.emit("roomList", getAllActiveRooms().map((room) => ({
        name: room,
        userCount: getUsersInRoom(room).length,
        maxUsers: roomMaxLimits[room] || null,
        hasPassword: !!roomPasswords[room],
        tags: roomTags[room] || []
    })));
};

const handleControllerChange = async (room) => {
    const remainingUsers = getUsersInRoom(room);
    if (remainingUsers.length > 0) {
        const newController = remainingUsers[0];
        newController.isController = true;
        roomControllers[room] = newController.id;
        const userDoc = await User.findById(newController.userId).lean();
        const controllerName = userDoc ? `${userDoc.firstName} ${userDoc.lastName}` : "Unknown User";
        io.to(room).emit("message", await buildMsg(ADMIN, `${controllerName} is now in control.`));
        io.to(newController.id).emit("youAreNowController");
    } else {
        delete roomControllers[room];
    }
};

io.on("connection", (socket) => {
    console.log(`User ${socket.id} connected`);

    socket.on("requestRoom", ({ maxUsers, password, tags }, callback) => {
        const existingRooms = getAllActiveRooms();
        let roomName = "0";
        while (existingRooms.includes(roomName)) roomName = (parseInt(roomName) + 1).toString();

        if (maxUsers) roomMaxLimits[roomName] = maxUsers;
        password ? roomPasswords[roomName] = password : delete roomPasswords[roomName];
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

        activateUser(socket.id, userId, room);
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
            socket.emit("youAreNowController");
        }

        callback({
            success: true,
            message: "Joined the room successfully.",
            users
        });
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
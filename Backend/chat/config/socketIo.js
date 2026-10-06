// import {Server} from 'socket.io'
// import http from 'http'
// import express from 'express'
// const app = express()
// const server = http.createServer(app) // ye HTTP server h 
// const io = new Server(server,{ // ye existing HTTP server ke upar Socket.io server create karta hain 
//     cors:{
//        origin: "https://chat-app-wine-six-41.vercel.app",
//     methods: ["GET", "POST"],
//     credentials: true
//     }
// })
// const userSocketMap = {}
// export const getRecieverSocketId = (receiverId) =>{
//     return userSocketMap[receiverId]
// }
// // iska kaam sirf userId se socketId nikalvana
// io.on("connection",(socket)=>{ // yaha par socket ek partiuclar client hain 
//     console.log("Socket c onnected",socket.id)
//     const userId = socket.handshake.query.userId || undefined
//     if(userId && userId!== undefined){
//         userSocketMap[userId] = socket.id
// //         Rahul
// //   ↓
// // userId = rahul123
// //   ↓
// // Socket.IO
// //   ↓
// // socket.id = abc123
// //   ↓
// // userSocketMap
// //   ↓
// // rahul123 → abc123
// // ye banega 
//         console.log(`User ${userId} mapped to socket ${socket.id}`)
//     }

//     io.emit("getOnlineUser",Object.keys(userSocketMap)) 
//     // isme jo jo user online hain unki list jayegi
//     if(userId){
//         socket.join(userId)
//     }
//     socket.on("typing",(data)=>{
//         console.log(`User ${userId} is typing to chat ${data.chatId}`)
//         socket.to(data.chatId).emit('userTyping',{
//             chatId:data.chatId,
//             userId:userId
//         })
//     })
//     socket.on("stopTyping",(data)=>{
//         console.log(`User ${userId} stopped typing in chat ${data.chatId}`)
//         socket.to(data.chatId).emit("userStoppedTyping",{
//               chatId:data.chatId,
//             userId:userId
//         })
//     })
//     // yaha ek room create ho rha haiin chatId ki maddad se 
//     socket.on("joinChat",(chatId)=>{
//         socket.join(chatId)
//         console.log(`User ${userId} joined chat room ${chatId}`)
//     })
//     // yaha ek room create ho rha hain chatid ki maddd se 
//     socket.on("leaveChat",(chatId)=>{
//         socket.leave(chatId)
//       console.log(`User ${userId} leave chat room ${chatId}`)

//     })
// socket.on("disconnect", () => {

//     console.log("Socket disconnected:", socket.id)

//     if (userId) {
//         delete userSocketMap[userId]

//         io.emit(
//             "getOnlineUser",
//             Object.keys(userSocketMap)
//         )
//     }
// })
//     socket.on("connect_error",(error)=>{
//         console.log("Socket Error")
//     })
// })
// export {server , app,io}
// // socket.to(room).emit() => Room ke sabhi others users
// // io.to(room).emit() => Room ke all users 
// // socket.emit() => Sirf current users 
// //io.emit() => Socket.Io server se connected sabhi users ko 

import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-app-wine-six-41.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Keep track of connected sockets per user
const userSocketMap = new Map();

export const getReceiverSocketId = (receiverId) => {
  const sockets = userSocketMap.get(String(receiverId));

  if (!sockets || sockets.size === 0) {
    return null;
  }

  return [...sockets][0];
};

export const getOnlineUserIds = () => {
  return [...userSocketMap.keys()];
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  const userId = socket.handshake.query.userId
    ? String(socket.handshake.query.userId)
    : null;

  if (!userId) {
    console.log("Socket connected without userId:", socket.id);
    return;
  }

  // --------------------------------------------------
  // USER ROOM
  // --------------------------------------------------

  // Every user gets their own room.
  // This is useful for messageSeen/read receipts.
  socket.join(userId);

  // Store socket under user
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }

  userSocketMap.get(userId).add(socket.id);

  console.log(
    `User ${userId} connected with socket ${socket.id}`
  );

  // Broadcast latest online users
  io.emit("getOnlineUser", getOnlineUserIds());

  // --------------------------------------------------
  // CHAT ROOM
  // --------------------------------------------------

  socket.on("joinChat", (chatId) => {
    if (!chatId) return;

    const roomId = String(chatId);

    socket.join(roomId);

    console.log(
      `User ${userId} joined chat room ${roomId}`
    );
  });

  socket.on("leaveChat", (chatId) => {
    if (!chatId) return;

    const roomId = String(chatId);

    socket.leave(roomId);

    console.log(
      `User ${userId} left chat room ${roomId}`
    );
  });

  // --------------------------------------------------
  // TYPING
  // --------------------------------------------------

  socket.on("typing", ({ chatId }) => {
    if (!chatId) return;

    socket.to(String(chatId)).emit("userTyping", {
      chatId: String(chatId),
      userId,
    });
  });

  socket.on("stopTyping", ({ chatId }) => {
    if (!chatId) return;

    socket.to(String(chatId)).emit("userStoppedTyping", {
      chatId: String(chatId),
      userId,
    });
  });

  // --------------------------------------------------
  // DISCONNECT
  // --------------------------------------------------

  socket.on("disconnect", (reason) => {
    console.log(
      `Socket disconnected: ${socket.id}`,
      reason
    );

    const userSockets = userSocketMap.get(userId);

    if (!userSockets) {
      return;
    }

    // Remove ONLY this socket.
    userSockets.delete(socket.id);

    // If user has no more sockets, mark offline.
    if (userSockets.size === 0) {
      userSocketMap.delete(userId);
    }

    io.emit("getOnlineUser", getOnlineUserIds());

    console.log(
      `Current online users:`,
      getOnlineUserIds()
    );
  });
});

export { server, app, io };

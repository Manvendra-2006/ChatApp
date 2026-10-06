// import { createContext, useContext, useEffect, useState } from 'react'
// import { io } from 'socket.io-client'
// import useAuth from '../hooks/useAuth'

// const SocketContext = createContext({
//   socket: null,
//   onlineUserIds: [],
// })

// export function SocketProvider({ children }) {
//   const { user } = useAuth()
//   const [socket, setSocket] = useState(null)
//   const [onlineUserIds, setOnlineUserIds] = useState([])

//   useEffect(() => {
//     if (!user?._id) {
//       setSocket((currentSocket) => {
//         currentSocket?.disconnect()
//         return null
//       })
//       setOnlineUserIds([])
//       return
//     }

//     const chatSocket = io(import.meta.env.VITE_CHAT_API_URL, {
//       transports: ['websocket'],
//       reconnection: true,
//       query: {
//         userId: user._id,
//       },
//     })

//     const handleOnlineUsers = (onlineIds) => {
//       setOnlineUserIds(Array.isArray(onlineIds) ? onlineIds.map(String) : [])
//     }

//     chatSocket.on('getOnlineUser', handleOnlineUsers)
//     setSocket(chatSocket)

//     return () => {
//       chatSocket.off('getOnlineUser', handleOnlineUsers)
//       chatSocket.disconnect()
//       setSocket(null)
//       setOnlineUserIds([])
//     }
//   }, [user?._id])

//   return (
//     <SocketContext.Provider value={{ socket, onlineUserIds }}>
//       {children}
//     </SocketContext.Provider>
//   )
// }

// export function useSocket() {
//   return useContext(SocketContext)
// }

// export default SocketContext


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

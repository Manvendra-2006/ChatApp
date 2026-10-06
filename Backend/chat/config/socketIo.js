import {Server} from 'socket.io'
import http from 'http'
import express from 'express'
const app = express()
const server = http.createServer(app) // ye HTTP server h 
const io = new Server(server,{ // ye existing HTTP server ke upar Socket.io server create karta hain 
    cors:{
       origin: "https://chat-app-wine-six-41.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
    }
})
const userSocketMap = {}
export const getRecieverSocketId = (receiverId) =>{
    return userSocketMap[receiverId]
}
// iska kaam sirf userId se socketId nikalvana
io.on("connection",(socket)=>{ // yaha par socket ek partiuclar client hain 
    console.log("Socket c onnected",socket.id)
    const userId = socket.handshake.query.userId || undefined
    if(userId && userId!== undefined){
        userSocketMap[userId] = socket.id
//         Rahul
//   ↓
// userId = rahul123
//   ↓
// Socket.IO
//   ↓
// socket.id = abc123
//   ↓
// userSocketMap
//   ↓
// rahul123 → abc123
// ye banega 
        console.log(`User ${userId} mapped to socket ${socket.id}`)
    }

    io.emit("getOnlineUser",Object.keys(userSocketMap)) 
    // isme jo jo user online hain unki list jayegi
    if(userId){
        socket.join(userId)
    }
    socket.on("typing",(data)=>{
        console.log(`User ${userId} is typing to chat ${data.chatId}`)
        socket.to(data.chatId).emit('userTyping',{
            chatId:data.chatId,
            userId:userId
        })
    })
    socket.on("stopTyping",(data)=>{
        console.log(`User ${userId} stopped typing in chat ${data.chatId}`)
        socket.to(data.chatId).emit("userStoppedTyping",{
              chatId:data.chatId,
            userId:userId
        })
    })
    // yaha ek room create ho rha haiin chatId ki maddad se 
    socket.on("joinChat",(chatId)=>{
        socket.join(chatId)
        console.log(`User ${userId} joined chat room ${chatId}`)
    })
    // yaha ek room create ho rha hain chatid ki maddd se 
    socket.on("leaveChat",(chatId)=>{
        socket.leave(chatId)
      console.log(`User ${userId} leave chat room ${chatId}`)

    })
socket.on("disconnect", () => {

    console.log("Socket disconnected:", socket.id)

    if (userId) {
        delete userSocketMap[userId]

        io.emit(
            "getOnlineUser",
            Object.keys(userSocketMap)
        )
    }
})
    socket.on("connect_error",(error)=>{
        console.log("Socket Error")
    })
})
export {server , app,io}
// socket.to(room).emit() => Room ke sabhi others users
// io.to(room).emit() => Room ke all users 
// socket.emit() => Sirf current users 
//io.emit() => Socket.Io server se connected sabhi users ko 
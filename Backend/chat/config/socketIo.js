import {Server} from 'socket.io'
import http from 'http'
import express from 'express'
const app = express()
const server = http.createServer(app) // ye HTTP server h 
const io = new Server(server,{ // ye existing HTTP server ke upar Socket.io server create karta hain 
    cors:{
        origin:"*",
        methods:['GET','POST']
    }
})
const userSocketMap = {}
io.on("connection",(socket)=>{ // yaha par socket ek partiuclar client hain 
    console.log("Socket connected",socket.id)
    socket.on("disconnect",()=>{
        console.log("Socket Disconnected",socket.id)
    })
    socket.on("connect_error",(error)=>{
        console.log("Socket Error")
    })
})
export {server , app}
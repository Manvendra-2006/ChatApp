import express from 'express'
import cors from 'cors'
import chatRouter from './routes/chat.routes.js'
import { app } from './config/socketIo.js'

app.use(cors({
     origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json())
app.use("/api/chat",chatRouter)
export default app
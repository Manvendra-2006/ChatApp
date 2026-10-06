import express from 'express'
import cors from 'cors'
import chatRouter from './routes/chat.routes.js'
import { app } from './config/socketIo.js'
import cookieParser from 'cookie-parser';

app.use(cors({
  origin: "https://chat-app-wine-six-41.vercel.app",
  credentials: true
}));
app.use(express.json())
app.use(cookieParser())
app.use("/api/chat",chatRouter)
export default app
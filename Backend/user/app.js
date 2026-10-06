import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.routes.js'
import cookieParser from 'cookie-parser'
const app = express()
app.use(cors({
    origin:"https://chat-app-wine-six-41.vercel.app",
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api/user",userRouter)
export default app
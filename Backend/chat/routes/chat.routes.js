import express from 'express'
import isAuth from '../middleware/isAuthMiddleware.js'
import { createaNewChat } from '../controllers/chat.controller.js'
const chatRouter = express.Router()
chatRouter.post("/newchat",isAuth,createaNewChat)
export default chatRouter
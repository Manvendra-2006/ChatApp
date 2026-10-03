import express from 'express'
import isAuth from '../middleware/isAuthMiddleware.js'
import { createaNewChat, getAllChats } from '../controllers/chat.controller.js'
const chatRouter = express.Router()
chatRouter.post("/newchat",isAuth,createaNewChat)
chatRouter.get('/getALlChats',isAuth,getAllChats)
export default chatRouter
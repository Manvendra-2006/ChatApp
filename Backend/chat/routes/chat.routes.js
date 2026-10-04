import express from 'express'
import isAuth from '../middleware/isAuthMiddleware.js'
import { createaNewChat, getAllChats, getMessagesByChat, sendMessage } from '../controllers/chat.controller.js'
import uploadFile from '../middleware/multerMiddleware.js'
const chatRouter = express.Router()
chatRouter.post("/newchat",isAuth,createaNewChat)
chatRouter.get('/getALlChats',isAuth,getAllChats)
chatRouter.post("/sendMessage",isAuth,uploadFile,sendMessage)
chatRouter.get(
    "/getMessagesByChat/:chatId",
    isAuth,
    getMessagesByChat
)
export default chatRouter
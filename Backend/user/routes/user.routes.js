import express from 'express'
import { fetchAccount, loginController, updateName, verifyUser,getAllUser } from '../controllers/user.controller.js'
import isAuth from '../middleware/isAuthMiddleware.js'
const userRouter = express.Router()
userRouter.post("/login",loginController)
userRouter.post("/verify",verifyUser)
userRouter.get("/account",isAuth,fetchAccount)
userRouter.patch("/update",isAuth,updateName)
userRouter.get("/AllUser",isAuth,getAllUser)

export default userRouter
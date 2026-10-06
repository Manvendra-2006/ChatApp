import express from 'express'
import { fetchAccount, loginController, logoutController, updateName, verifyUser,getAllUser, getUserDetailById } from '../controllers/user.controller.js'
import isAuth from '../middleware/isAuthMiddleware.js'
const userRouter = express.Router()
userRouter.post("/login",loginController)
userRouter.post("/verify",verifyUser)
userRouter.post("/logout",logoutController)
userRouter.get("/account",isAuth,fetchAccount)
userRouter.patch("/update",isAuth,updateName)
userRouter.get("/AllUser",isAuth,getAllUser)
userRouter.get("/getUserDetail/:userId",getUserDetailById)
export default userRouter
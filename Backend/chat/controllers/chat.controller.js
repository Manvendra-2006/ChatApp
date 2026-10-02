import Chat from "../models/chat.model.js"

export async function createaNewChat(req,resp){
    try{
        const userId = req.user.id
        const {otherUserId} = req.body
        if(!otherUserId){
            return resp.status(400).json({message:"Other UserId is required"})
        }
        const existingChat = await Chat.findOne({
            users:{$all:[userId,otherUserId],$size:2}
        })
        if(existingChat){
            return resp.status(200).json({message:"Chat is exist",existingChat})
        }
        const newChat = await Chat.create({
            users:[userId,otherUserId]
        })
        return resp.status(201).json({message:"New Chat Created",chatId:newChat._id})
    }
    catch(error){

    }
}
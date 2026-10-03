import Chat from "../models/chat.model.js"
import Message from "../models/message.model.js"
import axios from "axios"
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
        return resp.status(500).json({message:"Internal Server Error",error:error.message})
    }
}

export async function getAllChats(req,resp){
    try{
        const userId = req.user?.id
        if(!userId){
            return resp.status(400).json({message:"UserId is required"})
        }
        const AllChats = await Chat.find({users:userId}).sort({updatedAt:-1})
        const chatWithUserData = await Promise.all( // Promise.all multiple promise ko collectively handle karta hain 
            AllChats.map(async (chat)=>{
                const otheruserId = chat.users.find((id)=> id!== userId)
                const unseenCount = await Message.countDocuments({
                    chatId:chat._id,
                    sender:{$ne:userId},
                    seen:false
                })
                try{
                   const {data}  = await axios.get(`${process.env.USER_SERVICE}/api/user/getUserDetail/${otheruserId}`)
                   return {
                    user:data,
                    chat:{
                        ...chat.toObject(),
                        latestMessage:chat.latestMessage || null,
                        unseenCount
                    }
                   }
                }
                catch(error){
                    console.log("Error Occured",error)
                }
            })

        )
        return resp.status(200).json({chats:chatWithUserData})
    }
    catch(error){
        return resp.status(500).json({message:"Internal Server Error",error:error.message})

    }
}
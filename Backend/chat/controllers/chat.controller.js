import Chat from "../models/chat.model.js"
import Message from "../models/message.model.js"
import axios from "axios"
import getBuffer from "../config/datauri.js"
import { getReceiverSocketId, io } from "../config/socketIo.js"
// ye controller chat create karta hain two different logged in user ke 
export async function createaNewChat(req, resp) {
    try {
        const userId = req.user.id
        const { otherUserId } = req.body
        if (!otherUserId) {
            return resp.status(400).json({ message: "Other UserId is required" })
        }
        const existingChat = await Chat.findOne({
            users: { $all: [userId, otherUserId], $size: 2 }
        })
        if (existingChat) {
            return resp.status(200).json({ message: "Chat is exist", existingChat })
        }
        const newChat = await Chat.create({
            users: [userId, otherUserId]
        })
        return resp.status(201).json({ message: "New Chat Created", chatId: newChat._id })
    }
    catch (error) {
        return resp.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}
// ye controller logged-in user ke saare chats laata hain , har chat mein saamne wale user ke data aur unseen vale messages ko count karta hain 
export async function getAllChats(req, resp) {
    try {
        console.log("errror yaha hain be")
        const userId = req.user?.id
        if (!userId) {
            return resp.status(400).json({ message: "UserId is required" })
        }
        const AllChats = await Chat.find({ users: userId }).sort({ updatedAt: -1 })
        const chatWithUserData = await Promise.all( // Promise.all multiple promise ko collectively handle karta hain 
            AllChats.map(async (chat) => {
                const otheruserId = chat.users.find((id) => id !== userId) // samne vale user ki id nikal rhi hain
                const unseenCount = await Message.countDocuments({ // samne vale user ne kitne message bheje jo unseen h
                    chatId: chat._id,
                    sender: { $ne: userId },
                    seen: false
                })
                try {
                    const { data } = await axios.get(`${process.env.USER_SERVICE}/getUserDetail/${otheruserId}`)
                    return {
                        user: data,
                        chat: {
                            ...chat.toObject(),
                            latestMessage: chat.latestMessage || null,
                            unseenCount
                        }
                    }
                }
                catch (error) {
                    console.log("Error Occured", error)
                }
            })

        )
        return resp.status(200).json({ chats: chatWithUserData })
    }
    catch (error) {
        return resp.status(500).json({ message: "Internal Server Error", error: error.message })

    }
}
// ye controller main message send hoga aur CHat main latestMessage update hoga
export async function sendMessage(req, resp) {
    try {
        console.log("Apna malik")
        const senderId = req.user?.id
        console.log(req.user)
        console.log("helllo")
        console.log(senderId)
        if (!senderId) {
            return resp.status(400).json({ message: "SenderID is required" })
        }
        const { chatId, text } = req.body
        if (!chatId) {
            return resp.status(400).json({ message: "ChatID is required" })
        }
        const imageFile = req.file
        if (!imageFile && !text) {
            return resp.status(400).json({ message: "Please give file or text" })
        }
        let data = null;
        if (imageFile) {
            const fileBuffer = getBuffer(imageFile)
            console.log("filebuffere", fileBuffer)
            if (!fileBuffer) {
                return resp.status(500).json({ message: "Failed to create file buffer" })
            }
            console.log("333333333333333333333333")
            const response = await axios.post(`${process.env.UTILI_SERVICE}/api/upload`, {
                buffer: fileBuffer
            })
            data = response.data
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            return resp.status(400).json({ message: "Chat not exist" })
        }
        // ye line check kar rhi hain ki senderID chat main hai ya nhi 
        const isUserInChat = chat.users.some((userId) => userId.toString() === senderId.toString())
        if (!isUserInChat) {
            return resp.status(403).json({
                message: "You are not a member of this chat"
            })
        }
        // ab hum other user ki id nikal rhe hain 
        const otheruserid = chat.users.find((userId) => userId.toString() !== senderId.toString())
        if (!otheruserid) {
            return resp.status(400).json({ message: "No other users" })
        }
        // socket setup
        const receiverSocketId = getReceiverSocketId(otheruserid.toString())
        let isRecieverInChatRoom = false
        if(receiverSocketId){ // agar user online hain 
            const receiverSocket = io.sockets.sockets.get(receiverSocketId) // reciever ka actual socket object nikalana 
            if(receiverSocket && receiverSocket.rooms.has(chatId)){
                isRecieverInChatRoom = true
            }
        }
        let messageData = {
            seen: isRecieverInChatRoom,
            seenAt: isRecieverInChatRoom ? new Date() :undefined,
            sender: senderId,
            chatId: chatId
        }
        if (imageFile) {
            messageData.image = {
                url: data.url,
                publicId: data.public_id
            }
            messageData.messageType = "Image"
        }
        else if (text) {
            messageData.text = text
            messageData.messageType = "text"
        }
        const message = await Message.create(messageData)
        const latestMessageText = imageFile ? 'Image' : text
        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: {
                text: latestMessageText,
                sender: senderId
            },
            updatedAt: new Date()  // chat update hoga toh ye new time aayega 
        }, { new: true })
       // A+B ki conversation = A aur B ki private conversation. C ko us room mein join nahi karna chahiye aur backend bhi C ko messages access nahi karne dena chahiye.
        io.to(chatId).emit("newMessage",message)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",message)
        }
        const senderSocketId = getReceiverSocketId(senderId.toString())
        if(senderSocketId){
            io.to(senderSocketId).emit("newMessage",message)
        }
        // Receiver ne dekh liya → Sender ko batao
        if(isRecieverInChatRoom && senderSocketId){
            io.to(senderSocketId).emit("messageSeen",{
                chatId:chatId,
                seenBy:otheruserid,
                messageIds:[message._id]
            })
        }
        return resp.status(201).json({ message: "message Saved Successfully", message, senderId: senderId })
    }
    catch (error) {
        return resp.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}
//Chat open/fetch karte waqt → us chat ke messages fetch hote hain → saamne wale ke unseen messages seen:true ho jaate hain → phir messages response mein mil jaate hain.
export async function getMessagesByChat(req, resp) {
    try {
        const userId = req.user?.id
        if (!userId) {
            return resp.status(401).json({ message: "Unauthorized" })
        }
        const  chatId  = req.params.chatId
        const chat = await Chat.findById(chatId)
        if (!chat) {
            return resp.status(400).json({ message: "Chat Not Found" })
        }
        const isUserInChat = chat.users.some((Id) => Id.toString() === userId.toString())
        if (!isUserInChat) {
            return resp.status(403).json({
                message: "You are not a member of this chat"
            })
        }
        const messagesTomarkSeen = await Message.find({
            chatId: chatId,
            sender: { $ne: userId },
            seen: false
        })
        await Message.updateMany({
            chatId: chatId,
            sender: { $ne: userId },
            seen: false
        }, {$set:{
             seen: true,
            seenAt: new Date()
        }
          
        })
        const messages = await Message.find({ chatId: chatId }).sort({ createdAt: 1 })
        const otheruserid = chat.users.find((Id) => Id.toString() !== userId.toString())
        if (!otheruserid) {
            return resp.status(400).json({ message: "You are not particiapnat of this chat " })
        }
        try {
            const { data } = await axios.get(`${process.env.USER_SERVICE}/api/user/getUserDetail/${otheruserid}`)   
            //B jab chat open karta hai, B ke unread messages ko seen mark karke Socket.IO se A ko bataya jaata hai ki B ne kaun-kaun se messages dekh liye.
            if(messagesTomarkSeen.length>0)       {
                const otherUserSocketId = getReceiverSocketId(otheruserid.toString())
                if(otherUserSocketId){
                    io.to(otherUserSocketId).emit("messageSeen",{
                        chatId:chatId,
                        seenBy:userId,
                        messageIds:messagesTomarkSeen.map((msg)=> msg._id)
                    })
                }
            }
            return resp.status(200).json({message:" other dataUser  and all messages in a chat",messages,user:data})
        }
        catch (error) {
            console.log("Error Occured", error)
            return resp.json({
                messages,
                _id:otheruserid
            })
        }
    }
    catch (error) {
        return resp.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}
import mongoose from "mongoose";
const messageSchema = mongoose.Schema({
    chatId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        required:true
    },
    sender:{
        type:String,
        required:true
    },
    text:{
        type:String
    },
    image:{
        url:String,
        publicId:String
    },
    messageType:{
        type:String,
        enum:['text','Image'],
        default:"text"
    },
    seen:{
        type:Boolean,
        default:false
    },
    seenAt:{
        type:Date,
        default:null
    }
},{
    timestamps:true
})
export default mongoose.model("Message",messageSchema)
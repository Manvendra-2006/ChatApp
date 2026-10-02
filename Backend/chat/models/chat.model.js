import mongoose from "mongoose";
const chatSchema = mongoose.Schema({
    users:[
        {
            type:String,
            required:true
        }
    ],
    latestMessage:{
        text:String,
        sender:String
    }
},{
    timestamps:true
})
export default mongoose.model("Chat",chatSchema)
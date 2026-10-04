import express from 'express'
import cloudinary from 'cloudinary'
const router = express.Router()

router.post("/upload",async (req,resp)=>{
    try{
        
        console.log("ghghghghghgg")
        const {buffer} = req.body
        console.log(buffer)
        const cloud = await cloudinary.v2.uploader.upload(buffer)
        console.log("geeeeeeeeeee")
        resp.json({
            url:cloud.secure_url,
            public_id:cloud.public_id
        })
    }
    catch(error){
        return resp.status(500).json({message:"Internal Server Error",error:error.message})
    }
})
export default router
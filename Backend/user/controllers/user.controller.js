import { publishToQueue } from "../config/rabbitmq.js"
import User from "../models/user.model.js"
import jwt from 'jsonwebtoken'
import { redisClient } from "../server.js"

export async function loginController(req,resp){
    try{
      const {email}   = req.body
      if(!email){
        return resp.status(404).json({message:"Email Required"})
      }
      // One user can create one otp in one minute 
      const rateLimitKey = `otp:ratelimit:${email}`
      const ratelimit = await redisClient.get(rateLimitKey)
      if(ratelimit){
    return  resp.status(429).json({message:"Too many request please wait before requesting new otp"})
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpKey = `otp:${email}`
      await redisClient.set(otpKey,otp,{
        EX:300 // 300 second baad expire ho jayega 
      })
      await redisClient.set(rateLimitKey,"true" , {
        EX:60 // 60 second baad expire ho jayega 
        // User 1 minute ke andar OTP send nhi kar skta 
      })
      const message = {
        to:email,
        subject:"Your otp code",
        body:`Your OTP is ${otp} . It is valid for 5 minute`
      }
      await publishToQueue("send-otp",message)
     return  resp.status(200).json({message:"OTP sent to your email"})
    }
    catch(error){
      return resp.status(500).json({message:"Internal Server Error",error:error.message})
      }
}

export async function verifyUser(req,resp){
  try{
    const {email,otp} = req.body
    if(!email || !otp){
      return resp.status(400).json({message:"Email and Otp Required"})
    }
    const otpKey = `otp:${email}`
    const storedOtp = await redisClient.get(otpKey)
    if(!storedOtp || storedOtp !== otp){
      return resp.status(400).json({message:"Otp is invlaid or expired"})
    }
    await redisClient.del(otpKey)
    let user = await User.findOne({email})
    if(!user){
      const name = email.slice(0,8)
      user = await User.create({email,name})
    }
    const token = jwt.sign(
      {id:user._id,email:user.email},
      process.env.JWT_TOKEN,
      {expiresIn:'7d'}
    )
    resp.cookie("token",token)
    return resp.status(200).json({message:"User Verified",user})
  }
  catch(error){
          return resp.status(500).json({message:"Internal Server Error",error:error.message})
 
  }
}

export async function fetchAccount(req,resp){
  try{
    const userId = req.user.id
    console.log(req.user)
    if(!userId){
      return resp.status(400).json({message:"UserId required"})
    }
    const account = await User.findOne({_id:userId})
    if(account){
      return resp.status(200).json({message:"Account is fetched Successfully",account})
    }
  }catch(error){
      return resp.status(500).json({message:"Internal Server Error",error:error.message})

  }
}

export async function updateName(req,resp){
  try{
    const userId = req.user.id
    console.log(req.user)
    if(!userId){
      return resp.status(400).json({message:"UserId required"})
    }
    const {updatedName} = req.body
    if(!updatedName){
      return resp.status(400).json({message:"Updated Name Required"})
    }
    const UpdatedNameDetail = await User.updateOne({_id:userId},{$set:{name:updatedName}},{new:true})
    if(UpdatedNameDetail){
      return resp.status(200).json({message:"Name is updated",UpdatedNameDetail})
    }
  }
  catch(error){
   return resp.status(500).json({message:"Internal Server Error",error:error.message})
  }
}

export async function getAllUser(req,resp){
  try{
    const ALLUser = await User.find()  
    if(ALLUser){
      return resp.status(200).json({message:"All User Get",ALLUser})
    }
  }
  catch(error){
     return resp.status(500).json({message:"Internal Server Error",error:error.message})

  }
}


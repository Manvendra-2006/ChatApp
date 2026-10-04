import express from 'express'
import cloudinary from 'cloudinary'
import router from './routes/cloudinary.js'
const app = express()
app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({extended:true,
    limit:"50mb"
}))

const {CLOUD_NAME,CLOUD_API_KEY,CLOUD_SECRET_KEY} = process.env
if(!CLOUD_NAME||!CLOUD_API_KEY||!CLOUD_SECRET_KEY){
    throw new Error("All Cloudinary filds are required")
}
cloudinary.v2.config({
    cloud_name:CLOUD_NAME,
    api_key:CLOUD_API_KEY,
    api_secret:CLOUD_SECRET_KEY
})

app.use("/api",router)
export default app
import 'dotenv/config'
import { connectDB } from './config/db.js';
import { server } from './config/socketIo.js';
connectDB()
server.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})
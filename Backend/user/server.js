import 'dotenv/config'
import app from "./app.js";
import { connectDb } from './config/db.js';
import { createClient } from 'redis';
import { connectRabbitMQ } from './config/rabbitmq.js';
connectDb()
connectRabbitMQ()
export const redisClient = createClient({
    url:process.env.REDIS_URL,
})
redisClient.connect().then(()=>{
    console.log("Connected to redis")
})
.catch((error)=>{
    console.log(error)
})
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT} `)
})
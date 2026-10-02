import 'dotenv/config'
import app from "./app.js";
import { startSendOtpConsumer } from './consumer.js';
startSendOtpConsumer()
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})
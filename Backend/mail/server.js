import 'dotenv/config'
import app from "./app.js";
import { startSendOtpConsumer,startsendEmailLogin } from './consumer.js';
startSendOtpConsumer()
startsendEmailLogin()
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})
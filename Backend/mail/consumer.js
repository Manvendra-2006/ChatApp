import 'dotenv/config'
import amqp from 'amqplib'
import nodemailer from 'nodemailer'
export  async function startSendOtpConsumer(){
    try{
        const connection = await amqp.connect({
                   protocol:"amqp",
                   hostname:process.env.RabbitMQ_host,
                   port:process.env.RabbitMQ_Communication_Port,
                   username:process.env.RabbitMQ_Username,
                   password:process.env.RabbitMQ_Password
               })

        const channel = await connection.createChannel()              
        const queueName = "send-otp"
        await channel.assertQueue(queueName,{durable:true})
        console.log("Mail Service consumer started listening for otp emails")
        channel.consume(queueName,async(msg)=>{
            if(msg){
                try{
                    const {to , subject , body} = JSON.parse(msg.content.toString())
                    const transporter = nodemailer.createTransport({
                        host:"smtp.gmail.com",
                        port:465,
                        auth:{
                            user:process.env.USER,
                            pass:process.env.PASSWORD
                        }
                    })
                    await transporter.sendMail({
                        from:"Chat APP Manvendra",
                        to,
                        subject,
                        text:body
                    })
                    console.log(`OTP mail send to ${to}`)
                    channel.ack(msg)
                }
                catch(error){
                    console.log("Failed to send OTP ",error)
                }
            }
        })
    }
    catch(error){
        console.log("Failed to start rabbitmq consumer",error)
    }
}
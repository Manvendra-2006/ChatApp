import 'dotenv/config'
import amqp from 'amqplib'
import nodemailer from 'nodemailer'
export async function startSendOtpConsumer() {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RabbitMQ_host,
            port: process.env.RabbitMQ_Communication_Port,
            username: process.env.RabbitMQ_Username,
            password: process.env.RabbitMQ_Password
        })

        connection.on("error", (err) => console.log("RabbitMQ connection error:", err.message))
        connection.on("close", () => console.log("RabbitMQ connection closed"))

        const channel = await connection.createChannel()

        // 2. channel ke turant baad
        channel.on("error", (err) => console.log("RabbitMQ channel error:", err.message))

        const queueName = "send-otp"
        await channel.assertQueue(queueName, { durable: true })
        console.log("Mail Service consumer started listening for otp emails")
        channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString())
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASSWORD
                        }
                    })
                    await transporter.sendMail({
                        from: "Chat APP Manvendra",
                        to,
                        subject,
                        text: body
                    })
                    console.log(`OTP mail send to ${to}`)
                    channel.ack(msg)
                }
                catch (error) {
                    console.log("Failed to send OTP ", error)
                    channel.nack(msg, false, false)
                }
            }
        })
    }
    catch (error) {
        console.log("Failed to start rabbitmq consumer", error)
    }
}
export async function startsendEmailLogin(){
        try{
             const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RabbitMQ_host,
            port: process.env.RabbitMQ_Communication_Port,
            username: process.env.RabbitMQ_Username,
            password: process.env.RabbitMQ_Password
        })
         connection.on("error", (err) => console.log("RabbitMQ connection error:", err.message))
        connection.on("close", () => console.log("RabbitMQ connection closed"))

        const channel = await connection.createChannel()

        // 2. channel ke turant baad
        channel.on("error", (err) => console.log("RabbitMQ channel error:", err.message))
        const queueName = "welcome-email"
         await channel.assertQueue(queueName, { durable: true })
        console.log("Mail Service consumer started listening for sending welcome  emails")
          channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString())
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASSWORD
                        }
                    })
                    await transporter.sendMail({
                        from: "Chat APP Manvendra",
                        to,
                        subject,
                        text: body
                    })
                    console.log(`Welcome email is send to ${to}`)
                    channel.ack(msg)
                }
                catch (error) {
                    console.log("Failed to send welocme emails", error)
                    channel.nack(msg, false, false)
                }
            }
        })
        }
        catch(error){
          console.log("Failed to start rabbitmq consumer", error)

        }
}
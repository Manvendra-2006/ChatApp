// import 'dotenv/config'
// import amqp from 'amqplib'
// import nodemailer from 'nodemailer'
// export async function startSendOtpConsumer() {
//     try {
//         // For Docker 
//         // const connection = await amqp.connect({
//         //     protocol: "amqp",
//         //     hostname: process.env.RabbitMQ_host,
//         //     port: process.env.RabbitMQ_Communication_Port,
//         //     username: process.env.RabbitMQ_Username,
//         //     password: process.env.RabbitMQ_Password
//         // })
//         const connection = await amqp.connect(process.env.RABBITMQ_URL);
//         connection.on("error", (err) => console.log("RabbitMQ connection error:", err.message))
//         connection.on("close", () => console.log("RabbitMQ connection closed"))

//         const channel = await connection.createChannel()

//         // 2. channel ke turant baad
//         channel.on("error", (err) => console.log("RabbitMQ channel error:", err.message))

//         const queueName = "send-otp"
//         await channel.assertQueue(queueName, { durable: true })
//         console.log("Mail Service consumer started listening for otp emails")
//         channel.consume(queueName, async (msg) => {
//             if (msg) {
//                 try {
//                     const { to, subject, body } = JSON.parse(msg.content.toString())
//                     const transporter = nodemailer.createTransport({
//                         host: "smtp.gmail.com",
//                         port: 465,
//                    auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_PASSWORD
// }
//                     })
//                     await transporter.sendMail({
//                         from: "Chat APP Manvendra",
//                         to,
//                         subject,
//                         text: body
//                     })
//                     console.log(`OTP mail send to ${to}`)
//                     channel.ack(msg)
//                 }
//                 catch (error) {
//                     console.log("Failed to send OTP ", error)
//                     channel.nack(msg, false, false)
//                 }
//             }
//         })
//     }
//     catch (error) {
//         console.log("Failed to start rabbitmq consumer", error)
//     }
// }
// export async function startsendEmailLogin(){
//         try{
//             // for Docker Only
//         //      const connection = await amqp.connect({
//         //     protocol: "amqp",
//         //     hostname: process.env.RabbitMQ_host,
//         //     port: process.env.RabbitMQ_Communication_Port,
//         //     username: process.env.RabbitMQ_Username,
//         //     password: process.env.RabbitMQ_Password
//         // })
//                 const connection = await amqp.connect(process.env.RABBITMQ_URL);
//          connection.on("error", (err) => console.log("RabbitMQ connection error:", err.message))
//         connection.on("close", () => console.log("RabbitMQ connection closed"))

//         const channel = await connection.createChannel()

//         // 2. channel ke turant baad
//         channel.on("error", (err) => console.log("RabbitMQ channel error:", err.message))
//         const queueName = "welcome-email"
//          await channel.assertQueue(queueName, { durable: true })
//         console.log("Mail Service consumer started listening for sending welcome  emails")
//           channel.consume(queueName, async (msg) => {
//             if (msg) {
//                 try {
//                     const { to, subject, body } = JSON.parse(msg.content.toString())
//                     const transporter = nodemailer.createTransport({
//                         host: "smtp.gmail.com",
//                         port: 465,
//                  auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_PASSWORD
// }
//                     })
//                     await transporter.sendMail({
//                         from: "Chat APP Manvendra",
//                         to,
//                         subject,
//                         text: body
//                     })
//                     console.log(`Welcome email is send to ${to}`)
//                     channel.ack(msg)
//                 }
//                 catch (error) {
//                     console.log("Failed to send welocme emails", error)
//                     channel.nack(msg, false, false)
//                 }
//             }
//         })
//         }
//         catch(error){
//           console.log("Failed to start rabbitmq consumer", error)

//         }
// }
import "dotenv/config";
import amqp from "amqplib";
import nodemailer from "nodemailer";


// 1. CREATE ONE SMTP TRANSPORTER


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// 2. VERIFY SMTP CONNECTION


async function verifySMTP() {
  try {
    await transporter.verify();
    console.log("Gmail SMTP connection verified successfully");
  } catch (error) {
    console.error("Gmail SMTP verification failed:", error.message);
  }
}

// 3. GENERIC CONSUMER WITH AUTO-RECONNECT
// Before: on "close" it only logged, so after the first dropped
// RabbitMQ connection (idle timeout / Render restart) the mail
// service stayed running but NEVER consumed again -> no OTP mail.
// Now: any close/error schedules a reconnect.

const RETRY_MS = 5000;

function startConsumer(queueName, label) {
  let retryTimer = null;

  const retry = () => {
    if (retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      run();
    }, RETRY_MS);
  };

  async function run() {
    let connection;

    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL);

      connection.on("error", (error) => {
        console.error(`[${label}] RabbitMQ connection error:`, error.message);
      });

      connection.on("close", () => {
        console.log(`[${label}] RabbitMQ connection closed, reconnecting...`);
        retry();
      });

      const channel = await connection.createChannel();

      channel.on("error", (error) => {
        console.error(`[${label}] RabbitMQ channel error:`, error.message);
      });

      // channel died but connection alive -> close connection to rebuild both
      channel.on("close", () => {
        connection.close().catch(() => {});
      });

      // Process only ONE message at a time
      await channel.prefetch(1);

      await channel.assertQueue(queueName, { durable: true });

      console.log(`Mail Service consumer started listening for ${label} emails`);

      await channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());

          console.log(`Processing ${label} email for: ${to}`);

          await transporter.sendMail({
            from: `Chat APP Manvendra <${process.env.GMAIL_USER}>`,
            to,
            subject,
            text: body,
          });

          console.log(`${label} email sent successfully to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.error(`Failed to send ${label} email:`, error.message);
          // false = don't requeue (prevents infinite retry loop)
          try {
            channel.nack(msg, false, false);
          } catch {
            // channel already closed; message will be redelivered
          }
        }
      });
    } catch (error) {
      console.error(`Failed to start ${label} consumer:`, error.message);
      // clean up half-open connection, then retry
      connection?.close().catch(() => {});
      retry();
    }
  }

  return run();
}

export function startSendOtpConsumer() {
  return startConsumer("send-otp", "OTP");
}

export function startsendEmailLogin() {
  return startConsumer("welcome-email", "welcome");
}

verifySMTP();

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

// ======================================================
// 1. CREATE ONE SMTP TRANSPORTER
// ======================================================

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

// ======================================================
// 2. VERIFY SMTP CONNECTION
// ======================================================

async function verifySMTP() {
  try {
    await transporter.verify();

    console.log("Gmail SMTP connection verified successfully");
  } catch (error) {
    console.error("Gmail SMTP verification failed:", error.message);
  }
}

// ======================================================
// 3. SEND OTP EMAIL CONSUMER
// ======================================================

export async function startSendOtpConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    connection.on("error", (error) => {
      console.error(
        "RabbitMQ connection error:",
        error.message
      );
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });

    // Create channel
    const channel = await connection.createChannel();

    channel.on("error", (error) => {
      console.error(
        "RabbitMQ channel error:",
        error.message
      );
    });

    // Process only ONE message at a time
    await channel.prefetch(1);

    const queueName = "send-otp";

    // Make sure queue exists
    await channel.assertQueue(queueName, {
      durable: true,
    });

    console.log(
      "Mail Service consumer started listening for OTP emails"
    );

    // Start consuming
    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        // Convert RabbitMQ message into object
        const { to, subject, body } = JSON.parse(
          msg.content.toString()
        );

        console.log(`Processing OTP email for: ${to}`);

        // Send email
        await transporter.sendMail({
          from: `Chat APP Manvendra <${process.env.GMAIL_USER}>`,
          to,
          subject,
          text: body,
        });

        console.log(`OTP mail sent successfully to ${to}`);

        // Message processed successfully
        channel.ack(msg);

      } catch (error) {
        console.error(
          "Failed to send OTP email:",
          error.message
        );

        /*
          false = don't send to multiple consumers
          false = don't put message back into queue

          This prevents an infinite retry loop.
        */
        channel.nack(msg, false, false);
      }
    });

  } catch (error) {
    console.error(
      "Failed to start RabbitMQ OTP consumer:",
      error.message
    );
  }
}

// ======================================================
// 4. SEND WELCOME EMAIL CONSUMER
// ======================================================

export async function startsendEmailLogin() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL
    );

    connection.on("error", (error) => {
      console.error(
        "RabbitMQ connection error:",
        error.message
      );
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });

    // Create channel
    const channel = await connection.createChannel();

    channel.on("error", (error) => {
      console.error(
        "RabbitMQ channel error:",
        error.message
      );
    });

    // Process one email at a time
    await channel.prefetch(1);

    const queueName = "welcome-email";

    // Make sure queue exists
    await channel.assertQueue(queueName, {
      durable: true,
    });

    console.log(
      "Mail Service consumer started listening for sending welcome emails"
    );

    // Start consuming
    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        // Convert message into object
        const { to, subject, body } = JSON.parse(
          msg.content.toString()
        );

        console.log(`Processing welcome email for: ${to}`);

        // Send email
        await transporter.sendMail({
          from: `Chat APP Manvendra <${process.env.GMAIL_USER}>`,
          to,
          subject,
          text: body,
        });

        console.log(
          `Welcome email sent successfully to ${to}`
        );

        // Message processed successfully
        channel.ack(msg);

      } catch (error) {
        console.error(
          "Failed to send welcome email:",
          error.message
        );

        // Remove failed message from queue
        channel.nack(msg, false, false);
      }
    });

  } catch (error) {
    console.error(
      "Failed to start RabbitMQ welcome email consumer:",
      error.message
    );
  }
}

// ======================================================
// 5. VERIFY SMTP WHEN FILE STARTS
// ======================================================

verifySMTP();

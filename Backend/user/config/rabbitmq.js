// import amqp from 'amqplib'
// // amqp is a local variable
// let channel ;

// export async function connectRabbitMQ(){
//     try{
//         // for Docker 
//         // const connection = await amqp.connect({
//         //     protocol:"amqp",
//         //     hostname:process.env.RabbitMQ_host,
//         //     port:process.env.RabbitMQ_Communication_Port,
//         //     username:process.env.RabbitMQ_Username,
//         //     password:process.env.RabbitMQ_Password
//         // })
//         const connection = await amqp.connect(process.env.RABBITMQ_URL);
//         channel = await connection.createChannel()
//         console.log("RabbitMQ is successfully connected ✔️")
//     }
//     catch(error){
//         console.log("Failed to connect to rabbitMQ",error)
//     }
// }

// export async function publishToQueue (queueName,message){
//     if(!channel){
//         console.log("RabbitMQ channel is not initilaized")
//         return ;
//     }
//     await channel.assertQueue(queueName,{durable:true})
//     channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)),{
//         persistent:true
//     })
// }
import amqp from "amqplib";

let channel = null;

export async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    connection.on("error", (error) => {
      console.error("RabbitMQ connection error:", error.message);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
      channel = null;
    });

    channel = await connection.createChannel();

    channel.on("error", (error) => {
      console.error("RabbitMQ channel error:", error.message);
    });

    await channel.assertQueue("send-otp", {
      durable: true,
    });

    await channel.assertQueue("welcome-email", {
      durable: true,
    });

    console.log("RabbitMQ is successfully connected ✔️");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error.message);

    // Very important:
    // server ko pata chale ki RabbitMQ connect nahi hua
    throw error;
  }
}

export async function publishToQueue(queueName, message) {
  // Don't silently continue
  if (!channel) {
    throw new Error(
      "RabbitMQ channel is not initialized"
    );
  }

  await channel.assertQueue(queueName, {
    durable: true,
  });

  const messageBuffer = Buffer.from(
    JSON.stringify(message)
  );

  const sent = channel.sendToQueue(
    queueName,
    messageBuffer,
    {
      persistent: true,
    }
  );

  if (!sent) {
    throw new Error(
      `RabbitMQ could not buffer message for queue: ${queueName}`
    );
  }

  console.log(
    `Message published to queue: ${queueName}`
  );

  return true;
}
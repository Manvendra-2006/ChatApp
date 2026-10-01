import amqp from 'amqplib'
// amqp is a local variable
let channel ;

export async function connectRabbitMQ(){
    try{
        const connection = await amqp.connect({
            protocol:"amqp",
            hostname:process.env.RabbitMQ_host,
            port:process.env.RabbitMQ_Communication_Port,
            username:process.env.RabbitMQ_Username,
            password:process.env.RabbitMQ_Password
        })
        channel = await connection.createChannel()
        console.log("RabbitMQ is successfully connected ✔️")
    }
    catch(error){
        console.log("Failed to connect to rabbitMQ",error)
    }
}

export async function publishToQueue (queueName,message){
    if(!channel){
        console.log("RabbitMQ channel is not initilaized")
        return ;
    }
    await channel.assertQueue(queueName,{durable:true})
    channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)),{
        persistent:true
    })
}
import amqp from "amqplib";

const QUEUES = ["send-otp", "welcome-email"];
const RETRY_MS = 5000;

let connection = null;
let channel = null;
let connecting = null;
let retryTimer = null;

function scheduleReconnect() {
  if (retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    try {
      await connectRabbitMQ();
    } catch {
      scheduleReconnect();
    }
  }, RETRY_MS);
}

export async function connectRabbitMQ() {
  // If a connect is already in progress, reuse it
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);

      conn.on("error", (error) => {
        console.error("RabbitMQ connection error:", error.message);
      });

      // Idle/dropped connections used to leave `channel = null` forever.
      // Now we reconnect automatically.
      conn.on("close", () => {
        console.log("RabbitMQ connection closed, reconnecting...");
        if (connection === conn) {
          connection = null;
          channel = null;
        }
        scheduleReconnect();
      });

      const ch = await conn.createChannel();

      ch.on("error", (error) => {
        console.error("RabbitMQ channel error:", error.message);
      });

      // If only the channel dies, close the connection so we rebuild both
      ch.on("close", () => {
        if (channel === ch) channel = null;
        conn.close().catch(() => {});
      });

      for (const queue of QUEUES) {
        await ch.assertQueue(queue, { durable: true });
      }

      connection = conn;
      channel = ch;
      console.log("RabbitMQ is successfully connected ✔️");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error.message);
      throw error;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function publishToQueue(queueName, message) {
  // Self-heal: if the channel was lost, try to reconnect once before failing
  if (!channel) {
    await connectRabbitMQ();
  }

  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  const sent = channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );

  if (!sent) {
    throw new Error(`RabbitMQ could not buffer message for queue: ${queueName}`);
  }

  console.log(`Message published to queue: ${queueName}`);
  return true;
}

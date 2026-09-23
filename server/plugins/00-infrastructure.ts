import { AMQPChannel, AMQPClient, QueueOk } from "@cloudamqp/amqp-client";
import { Redis } from "@upstash/redis";
import { getRequestURL, type H3Event } from "h3";

let redisClient: Redis | null = null;

let amqpClient: AMQPClient | null = null;
let rabbitConnection: Awaited<ReturnType<AMQPClient["connect"]>> | null = null;
let rabbitChannel: AMQPChannel | null = null;
let rabbitQueue: QueueOk | null = null;

let hmacSecretKey = "";
let consumerStarted = false;
let shuttingDown = false;

const QUEUE_NAME = "task_queue";

async function ensureRedisReady(config: ReturnType<typeof useRuntimeConfig>) {
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) {
    console.log("ℹ Upstash Redis is not configured; using local fallbacks");
    return;
  }

  const retryConfig = getRetryConfig(config);

  if (!redisClient) {
    redisClient = new Redis({
      url: config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
      // Opsional: automaticDeserialization: true (default)
    });
    console.log("✔ Upstash Redis client initialized");
  }

  await retryWithBackoff(
    "Redis",
    async () => {
      const pong = await redisClient!.ping();
      if (pong !== "PONG") throw new Error(`Unexpected PING response: ${pong}`);
      console.log("✔ Redis health check passed");
    },
    {
      ...retryConfig,
      isShuttingDown: () => shuttingDown,
    },
  );
}

async function ensureRabbitReady(config: ReturnType<typeof useRuntimeConfig>) {
  if (!config.CLOUDAMQP_URL) {
    console.log("ℹ CloudAMQP is not configured; queue worker disabled");
    return;
  }

  const retryConfig = getRetryConfig(config);

  if (rabbitChannel && rabbitQueue) return;

  const rabbitMqUrl = config.CLOUDAMQP_URL;

  await retryWithBackoff(
    "RabbitMQ",
    async () => {
      amqpClient = new AMQPClient(rabbitMqUrl as string);
      const connection = await amqpClient.connect();
      const channel = await connection.channel();

      const queue = await channel.queueDeclare(QUEUE_NAME, { durable: true });

      rabbitConnection = connection;
      rabbitChannel = channel;
      rabbitQueue = queue;

      console.log("✔ RabbitMQ channel created");
      console.log("✔ RabbitMQ health check passed");

      if (!consumerStarted) {
        // await setupRabbitConsumer(channel, QUEUE_NAME, publishWahaEvent);
        consumerStarted = true;
      }
    },
    {
      ...retryConfig,
      isShuttingDown: () => shuttingDown,
    },
  );
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  console.log("🚀 Bootstrapping global infrastructure...");

  void ensureRedisReady(config);
  void ensureRabbitReady(config);

  nitroApp.hooks.hook("request", async (event: H3Event) => {
    if (redisClient) {
      event.context.redis = redisClient;
      const { setRedis } = useRedis(event);
      setRedis(redisClient);
    }

    if (rabbitChannel && rabbitConnection && rabbitQueue) {
      event.context.rabbitmq = {
        channel: rabbitChannel,
        connection: rabbitConnection,
        queue: rabbitQueue,
        sendToQueue: async (message: any) => {
          await rabbitChannel!.basicPublish(
            "", // default exchange
            QUEUE_NAME, // routing key = queue name
            Buffer.from(JSON.stringify(message)),
            { deliveryMode: 2 },
          );
        },
      };
    }

    if (getRequestURL(event).pathname.startsWith("/api/auth/")) {
      const { ServerHandler } = await import("../handlers");
      event.context.handler = new ServerHandler(event);
    }
  });

  nitroApp.hooks.hook("close", async () => {
    console.log("🛑 Server stopping, cleaning up global infrastructure...");
    shuttingDown = true;

    redisClient = null;
    console.log("🛑 Redis client released");

    if (rabbitChannel) {
      try {
        await rabbitChannel.close();
        console.log("🛑 RabbitMQ channel closed");
      } catch (error) {
        console.error("❌ Error closing RabbitMQ channel:", error);
      } finally {
        rabbitChannel = null;
        rabbitQueue = null;
      }
    }

    if (rabbitConnection) {
      try {
        await rabbitConnection.close();
        console.log("🛑 RabbitMQ connection closed");
      } catch (error) {
        console.error("❌ Error closing RabbitMQ connection:", error);
      } finally {
        rabbitConnection = null;
        amqpClient = null;
      }
    }

    consumerStarted = false;
  });
});

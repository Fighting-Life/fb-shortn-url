import { AMQPClient } from "@cloudamqp/amqp-client";
import { Redis } from "@upstash/redis";

const QUEUE_NAME = "task_queue";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const expectedToken = String(config.INTERNAL_HEALTH_TOKEN || "");
  const receivedToken = getHeader(event, "x-internal-health-token") || "";

  if (expectedToken && receivedToken !== expectedToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const redisHealth = await measureHealth(async () => {
    const client = new Redis({
      url: config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
    });

    try {
      await client.ping();
    } finally {
      // await client.cl().catch(() => undefined);
    }
  });

  const rabbitHealth = await measureHealth(async () => {
    const retryConfig = getRetryConfig(config);

    const rabbitMqUrl = config.CLOUDAMQP_URL;

    const client = new AMQPClient(rabbitMqUrl as string);
    await client.connect();
    const channel = await client.channel();

    try {
      await channel.queueDeclare(QUEUE_NAME, { durable: true });
    } finally {
      await channel.close().catch(() => undefined);
    }
  });

  const ok = redisHealth.ok && rabbitHealth.ok;

  if (!ok) {
    throw createError({
      statusCode: 503,
      statusMessage: "Infrastructure unhealthy",
      data: {
        redis: redisHealth,
        rabbitmq: rabbitHealth,
      },
    });
  }

  return {
    ok: true,
    redis: redisHealth,
    rabbitmq: rabbitHealth,
  };
});

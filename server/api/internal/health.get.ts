import { AMQPClient } from "@cloudamqp/amqp-client";
import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "node:crypto";

const QUEUE_NAME = "task_queue";

function tokensMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const expectedToken = String(config.INTERNAL_HEALTH_TOKEN || "");
  const receivedToken = getHeader(event, "x-internal-health-token") || "";

  if (!expectedToken || !tokensMatch(expectedToken, receivedToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const redisConfigured = Boolean(
    config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN,
  );
  const rabbitConfigured = Boolean(config.CLOUDAMQP_URL);

  const redisHealth = redisConfigured
    ? await measureHealth(async () => {
      const client = new Redis({
        url: config.UPSTASH_REDIS_REST_URL,
        token: config.UPSTASH_REDIS_REST_TOKEN,
      });
      await client.ping();
    })
    : { ok: true, configured: false };

  const rabbitHealth = rabbitConfigured
    ? await measureHealth(async () => {
      const client = new AMQPClient(config.CLOUDAMQP_URL as string);
      const connection = await client.connect();
      const channel = await connection.channel();

      try {
        await channel.queueDeclare(QUEUE_NAME, { durable: true });
      } finally {
        await channel.close().catch(() => undefined);
        await connection.close().catch(() => undefined);
      }
    })
    : { ok: true, configured: false };

  const ok = redisHealth.ok && rabbitHealth.ok;

  if (!ok) {
    console.error("Internal infrastructure health check failed", {
      redis: redisHealth,
      rabbitmq: rabbitHealth,
    });

    throw createError({
      statusCode: 503,
      statusMessage: "Service unavailable",
    });
  }

  return {
    ok: true,
    services: {
      redis: redisHealth,
      rabbitmq: rabbitHealth,
    },
  };
});

import type { AMQPChannel } from "@cloudamqp/amqp-client";

const RETRY_INITIAL_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 30000;
const DEFAULT_MAX_RETRY_ATTEMPTS = 5;
const DEFAULT_ALERT_COOLDOWN_MS = 5 * 60 * 1000;

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function nextDelay(currentDelay: number) {
  const jitter = Math.floor(currentDelay * 0.2 * Math.random());
  return Math.min(RETRY_MAX_DELAY_MS, currentDelay * 2 + jitter);
}

export function getRetryConfig(runtimeConfig: any) {
  return {
    maxRetryAttempts: parseInt(
      runtimeConfig.INFRA_MAX_RETRY_ATTEMPTS ||
        String(DEFAULT_MAX_RETRY_ATTEMPTS),
      10,
    ),
    alertCooldownMs: parseInt(
      runtimeConfig.INFRA_RETRY_ALERT_COOLDOWN_MS ||
        String(DEFAULT_ALERT_COOLDOWN_MS),
      10,
    ),
  };
}

export async function retryWithBackoff(
  label: string,
  task: () => Promise<void>,
  options?: {
    maxRetryAttempts?: number;
    alertCooldownMs?: number;
    onError?: (error: unknown) => void;
    isShuttingDown?: () => boolean;
  },
) {
  let delay = RETRY_INITIAL_DELAY_MS;
  let retryCount = 0;
  let lastAlertAt = 0;

  const maxRetryAttempts =
    options?.maxRetryAttempts ?? DEFAULT_MAX_RETRY_ATTEMPTS;
  const alertCooldownMs = options?.alertCooldownMs ?? DEFAULT_ALERT_COOLDOWN_MS;

  while (!options?.isShuttingDown?.()) {
    try {
      await task();
      return true;
    } catch (error) {
      options?.onError?.(error);
      retryCount += 1;

      const now = Date.now();
      const shouldAlert =
        retryCount >= maxRetryAttempts && now - lastAlertAt >= alertCooldownMs;

      if (shouldAlert) {
        lastAlertAt = now;
        console.error(
          `❌ [ALERT] ${label} unavailable after ${retryCount} retry attempts.`,
          error,
        );
      } else {
        console.error(
          `❌ ${label} init failed; retrying in ${Math.round(delay / 1000)}s`,
          error,
        );
      }

      await sleep(delay);
      delay = nextDelay(delay);
    }
  }

  return false;
}

export type HealthResult = {
  ok: boolean;
  status: "up" | "down";
  latencyMs?: number;
  error?: string;
};

export async function measureHealth(
  task: () => Promise<void>,
): Promise<HealthResult> {
  const startedAt = Date.now();

  try {
    await task();
    return {
      ok: true,
      status: "up",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      status: "down",
      latencyMs: Date.now() - startedAt,
      error: toErrorMessage(error),
    };
  }
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function setupRabbitConsumer(
  channel: AMQPChannel,
  queueName: string,
  handler: (data: any) => Promise<void>,
) {
  await channel.basicConsume(queueName, { noAck: false }, async (msg) => {
    try {
      const content = msg.bodyToString();
      if (!content) {
        await msg.ack();
        return;
      }
      const data = JSON.parse(content);
      await handler(data);
      await msg.ack();
    } catch (error) {
      console.error("❌ Consumer error:", error);
      // requeue=false agar tidak infinite loop
      await msg.nack(false);
    }
  });

  console.log(`✔ RabbitMQ consumer started on queue "${queueName}"`);
}

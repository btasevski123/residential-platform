import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { getVapidPrivateKey, getVapidPublicKey, isWebPushConfigured } from "@/lib/notifications/config";

export { getVapidPublicKey, isWebPushConfigured } from "@/lib/notifications/config";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

export type PushSendResult = { skipped: true } | { skipped?: false; sent: number };

type PushSubscriptionKeys = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushTransport = (
  subscriptions: PushSubscriptionKeys[],
  payload: PushPayload,
) => Promise<PushSendResult>;

let transport: PushTransport = sendViaWebPush;

export function setPushTransportForTests(next: PushTransport | null) {
  transport = next ?? sendViaWebPush;
}

export async function sendNotificationPush(
  subscriptions: PushSubscriptionKeys[],
  payload: PushPayload,
): Promise<PushSendResult> {
  if (subscriptions.length === 0) {
    return { skipped: true };
  }

  return transport(subscriptions, payload);
}

async function sendViaWebPush(
  subscriptions: PushSubscriptionKeys[],
  payload: PushPayload,
): Promise<PushSendResult> {
  if (!isWebPushConfigured()) {
    return { skipped: true };
  }

  webpush.setVapidDetails(
    process.env.EMAIL_FROM ?? "mailto:hello@localhost",
    getVapidPublicKey(),
    getVapidPrivateKey(),
  );

  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
          return;
        }
        throw error;
      }
    }),
  );

  return { sent };
}

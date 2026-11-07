export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function sendBrowserPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
  }
): Notification | null {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon ?? "/favicon.ico",
      tag: options?.tag,
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // Ignore focus error in background
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("Push notification display failed:", err);
    return null;
  }
}


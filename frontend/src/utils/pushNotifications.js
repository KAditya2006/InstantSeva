import {
  getPushPublicKey,
  subscribePushNotifications,
  unsubscribePushNotifications
} from '../services/api';

const SERVICE_WORKER_PATH = '/push-sw.js';

const isPushSupported = () => (
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window
);

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getRegistration = async () => {
  const existingRegistration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  return existingRegistration || navigator.serviceWorker.register(SERVICE_WORKER_PATH);
};

const getServerPublicKey = async () => {
  const { data } = await getPushPublicKey();
  if (!data.enabled || !data.publicKey) return null;
  return data.publicKey;
};

const saveBrowserSubscription = async () => {
  const publicKey = await getServerPublicKey();
  if (!publicKey) return 'not-configured';

  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  await subscribePushNotifications(subscription.toJSON());
  return 'enabled';
};

export const getPushNotificationStatus = async () => {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission === 'granted') return saveBrowserSubscription();
  return 'available';
};

export const enablePushNotifications = async () => {
  if (!isPushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission === 'denied') return 'blocked';
  if (permission !== 'granted') return 'available';

  return saveBrowserSubscription();
};

export const disablePushNotifications = async () => {
  if (!isPushSupported()) return 'unsupported';

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return 'available';

  await unsubscribePushNotifications({ endpoint: subscription.endpoint });
  await subscription.unsubscribe();
  return 'available';
};

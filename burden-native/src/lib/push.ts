// Phone push notifications (Expo). After a live gift, the app asks once for
// permission, gets this phone's Expo push token and links it to the gifts on
// this phone (each proven with its private token) via push-register. The
// server's notify-sweep then pushes "your gift reached the church", "the
// church confirmed" and new updates on burdens you gave to.
// Needs a development or store build: Expo Go cannot receive pushes on Android.
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Gift } from '../data/mock';
import { liveCheckout } from './payments';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Show a notification even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

let asked = false;

export async function registerForPush(gifts: Gift[]): Promise<void> {
  if (!liveCheckout || !SUPABASE_URL) return;
  const live = gifts.filter((g) => g.live && g.token).map((g) => ({ id: g.id, t: g.token! }));
  if (!live.length) return;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && !asked) {
      asked = true;
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Gift updates', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await fetch(`${SUPABASE_URL}/functions/v1/push-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(ANON_KEY ? { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } : {}) },
      body: JSON.stringify({ token, gifts: live }),
    });
  } catch (e) {
    // Expo Go / no network / simulator: notifications simply stay off.
    console.warn('push registration skipped', e);
  }
}

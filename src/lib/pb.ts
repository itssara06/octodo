import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

// The URL where the PocketBase server is running
export const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';

export async function createServerClient() {
  const cookieStore = await cookies();
  const pb = new PocketBase(PB_URL);

  // Load the auth store state from the cookie
  const cookie = cookieStore.get('pb_auth');
  const cookieString = cookie ? `${cookie.name}=${cookie.value}` : '';
  pb.authStore.loadFromCookie(cookieString);

  // Send a new cookie to the client if the auth state changes
  pb.authStore.onChange(() => {
    const cookieValue = JSON.stringify({ token: pb.authStore.token, model: pb.authStore.model });
    cookieStore.set('pb_auth', cookieValue, { httpOnly: true, path: '/' });
  });

  try {
    // refresh the auth token if it is valid
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh();
    }
  } catch (_) {
    // clear the auth store on failed refresh
    pb.authStore.clear();
  }

  return pb;
}

export async function getSession() {
  const cookieStore = await cookies();
  const pb = new PocketBase(PB_URL);
  
  const cookie = cookieStore.get('pb_auth');
  const cookieString = cookie ? `${cookie.name}=${cookie.value}` : '';
  pb.authStore.loadFromCookie(cookieString);

  return {
    isValid: pb.authStore.isValid,
    user: pb.authStore.model
  };
}

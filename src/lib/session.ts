import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { cache } from 'react';

const secretKey = process.env.SESSION_SECRET || 'super-secret-key-replace-me';
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  email: string;
  role: string;
  name?: string;
  expiresAt: Date;
};

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ ...payload, expiresAt });
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return { user: null, isValid: false };
  
  const payload = await decrypt(session);
  if (!payload) return { user: null, isValid: false };
  
  // Format for compatibility with existing components
  return { 
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name
    }, 
    isValid: true 
  };
});

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

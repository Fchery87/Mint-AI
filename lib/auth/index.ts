/**
 * Better Auth exports for Mint AI
 * 
 * This file re-exports the auth instance and commonly used utilities
 * for easy importing throughout the application.
 */

// Client-side auth utilities (use API routes)
export const signIn = async (email: string, password: string) => {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
};

export const signUp = async (email: string, password: string, name?: string) => {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return await res.json();
};

export const signOut = async () => {
  const res = await fetch('/api/auth/signout', {
    method: 'POST',
  });
  return await res.json();
};

export const getSession = async () => {
  const res = await fetch('/api/auth/session');
  return await res.json();
};

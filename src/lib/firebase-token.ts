import { auth } from '../../firebase/firebaseConfig';

export async function getFirebaseIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  
  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting Firebase ID token:', error);
    return null;
  }
}

export async function getFirebaseIdTokenWithRefresh(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  
  try {
    // Force refresh the token
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error refreshing Firebase ID token:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    // Decode the JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't decode, consider it expired
  }
}

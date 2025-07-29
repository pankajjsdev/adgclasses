import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../auth-context';

export default function AuthLayout() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn]);

  return <Stack screenOptions={{ headerShown: false }} />;
} 
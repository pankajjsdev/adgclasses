import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../auth-context';

export default function MainAppLayout() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isLoggedIn) {
  //     router.replace('/(auth)/login');
  //   }
  // }, [isLoggedIn]);

  return <Stack screenOptions={{ headerShown: true }} />;
} 
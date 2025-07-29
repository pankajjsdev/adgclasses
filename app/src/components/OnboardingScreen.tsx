import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding Screen</Text>
      <Text style={styles.text}>This is a dummy onboarding screen.</Text>
      <Button title="Complete Onboarding" onPress={onComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

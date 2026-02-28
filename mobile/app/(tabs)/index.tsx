import { StyleSheet, View, Text, Button, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [content, setContent] = useState('');

  const handleGenerate = async () => {
    // TODO: Call API
    console.log('Generate content');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome{user ? `, ${user.fullName}` : ''}
      </ThemedText>
      <Button title="Generate Content" onPress={handleGenerate} />
      {content && <ThemedText style={styles.content}>{content}</ThemedText>}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <ThemedText type="link">Sign Out</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    marginTop: 20,
    textAlign: 'center',
  },
  logout: {
    marginTop: 24,
  },
});
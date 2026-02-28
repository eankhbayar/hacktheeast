import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      let message = 'Login failed';
      if (err && typeof err === 'object') {
        const ax = err as {
          code?: string;
          message?: string;
          response?: { data?: { error?: string } };
        };
        if (ax.code === 'ECONNREFUSED' || ax.code === 'ERR_NETWORK') {
          message = 'Cannot connect to server. Is the backend running?';
        } else if (ax.code === 'ETIMEDOUT') {
          message = 'Request timed out. Check your connection.';
        } else if (ax.response?.data?.error) {
          message = ax.response.data.error;
        } else if (ax.message) {
          message = ax.message;
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ThemedText type="title" style={styles.title}>
          Sign In
        </ThemedText>

        {error ? (
          <ThemedText style={[styles.error, { color: '#dc2626' }]}>
            {error}
          </ThemedText>
        ) : null}

        <TextInput
          style={[styles.input, { backgroundColor }]}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, { backgroundColor }]}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText lightColor="#fff" darkColor="#fff" style={styles.buttonText}>
              Sign In
            </ThemedText>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText>Don&apos;t have an account? </ThemedText>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <ThemedText type="link">Register</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  keyboardView: {
    width: '100%',
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  error: {
    marginBottom: 16,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
});

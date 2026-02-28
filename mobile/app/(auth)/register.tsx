import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { BlipRobot } from '@/images';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      let message = 'Registration failed';
      if (err && typeof err === 'object') {
        const ax = err as {
          code?: string;
          message?: string;
          response?: { data?: { error?: string; errors?: { msg?: string }[] }; status?: number };
        };
        if (ax.code === 'ECONNREFUSED' || ax.code === 'ERR_NETWORK') {
          message = 'Cannot connect to server. Is the backend running? Try http://localhost:3000';
        } else if (ax.code === 'ETIMEDOUT') {
          message = 'Request timed out. Check your connection.';
        } else if (ax.response?.data) {
          const d = ax.response.data;
          message = d.error || d.errors?.[0]?.msg || message;
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brandingSection}>
            <Text style={styles.welcomeText}>Join</Text>
            <Text style={styles.brandName}>BLIP</Text>
            <Image source={BlipRobot} style={styles.mascot} resizeMode="contain" />
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#A0A0A0"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#A0A0A0"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#A0A0A0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={YELLOW} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  brandingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeText: {
    fontSize: 18,
    color: DARK_OLIVE,
    fontWeight: '500',
  },
  brandName: {
    fontSize: 48,
    fontWeight: '900',
    color: DARK,
    letterSpacing: 2,
    marginTop: 2,
  },
  mascot: {
    width: 220,
    height: 220,
    marginTop: 12,
  },

  formSection: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
    color: DARK,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: DARK_OLIVE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: YELLOW,
    fontWeight: '700',
    fontSize: 17,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: DARK_OLIVE,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    textDecorationLine: 'underline',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { loginSchema } from '@monorepo/validation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { HostSettingsModal } from '../components/HostSettingsModal';
import { api } from '../lib/api';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);

  const handleLogin = async () => {
    setErrors({});
    setApiError(null);

    // Validate using monorepo shared Zod validation schema
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setApiError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setPresetUser = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrors({});
    setApiError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setShowHostModal(true)}
            style={[styles.iconButton, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>⚙️ Server Host</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconButton, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>{isDark ? '☀️ Light' : '🌙 Dark'}</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Monorepo Mobile</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            React Native + NestJS + PostgreSQL
          </Text>
          <Text style={[styles.apiBadge, { color: colors.primary }]}>
            Target: {api.getBaseUrl()}
          </Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sign In</Text>

          {apiError && (
            <View style={[styles.errorAlert, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger }]}>
              <Text style={[styles.errorAlertText, { color: colors.danger }]}>{apiError}</Text>
            </View>
          )}

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
          />

          {/* Quick-Fill Test Accounts */}
          <View style={styles.presetsContainer}>
            <Text style={[styles.presetsTitle, { color: colors.textMuted }]}>
              Quick Fill Demo Credentials:
            </Text>
            <View style={styles.presetButtonsGrid}>
              <TouchableOpacity
                onPress={() => setPresetUser('superadmin@example.com', 'SuperAdmin123!')}
                style={[styles.roleBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
              >
                <Text style={[styles.roleBtnText, { color: colors.primary }]}>Super Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPresetUser('admin@example.com', 'Admin123!')}
                style={[styles.roleBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
              >
                <Text style={[styles.roleBtnText, { color: colors.primary }]}>Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPresetUser('moderator@example.com', 'User123!')}
                style={[styles.roleBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
              >
                <Text style={[styles.roleBtnText, { color: colors.primary }]}>Moderator</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPresetUser('user@example.com', 'User123!')}
                style={[styles.roleBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
              >
                <Text style={[styles.roleBtnText, { color: colors.primary }]}>Regular User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted }}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToRegister} style={{ marginLeft: 6 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Register here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <HostSettingsModal visible={showHostModal} onClose={() => setShowHostModal(false)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 10,
  },
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  apiBadge: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorAlert: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  presetButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  roleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


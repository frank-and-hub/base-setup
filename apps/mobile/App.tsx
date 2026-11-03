import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { UserDashboardScreen } from './src/screens/UserDashboardScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminUsersScreen } from './src/screens/AdminUsersScreen';
import { AdminRolesScreen } from './src/screens/AdminRolesScreen';
import { AdminLogsScreen } from './src/screens/AdminLogsScreen';
import { AdminHealthScreen } from './src/screens/AdminHealthScreen';
import { AdminKnowledgeGraphScreen } from './src/screens/AdminKnowledgeGraphScreen';
import { HostSettingsModal } from './src/components/HostSettingsModal';

type AuthView = 'login' | 'register';
type AdminView = 'dashboard' | 'users' | 'roles' | 'logs' | 'health' | 'graphify';

const MainNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [showHostModal, setShowHostModal] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Connecting to Monorepo Backend...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterScreen onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onNavigateToRegister={() => setAuthView('register')} />;
  }

  // Role-Based Redirection (Identical to Web Next.js Logic)
  const isAdminRole = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MODERATOR';

  if (!isAdminRole) {
    // Standard User experience
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Navigation Bar */}
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.navTitle, { color: colors.text }]}>Member Portal</Text>
          <View style={styles.navActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.navBtn}>
              <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <UserDashboardScreen />
      </View>
    );
  }

  // Admin Experience with Sub-module switching
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Admin Top Bar */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.navTitle, { color: colors.text }]}>Admin Console</Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={() => setShowHostModal(true)} style={styles.navBtn}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.navBtn}>
            <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {adminView === 'dashboard' && (
        <AdminDashboardScreen onNavigateModule={(mod) => setAdminView(mod)} />
      )}
      {adminView === 'users' && (
        <AdminUsersScreen onBack={() => setAdminView('dashboard')} />
      )}
      {adminView === 'roles' && (
        <AdminRolesScreen onBack={() => setAdminView('dashboard')} />
      )}
      {adminView === 'logs' && (
        <AdminLogsScreen onBack={() => setAdminView('dashboard')} />
      )}
      {adminView === 'health' && (
        <AdminHealthScreen onBack={() => setAdminView('dashboard')} />
      )}
      {adminView === 'graphify' && (
        <AdminKnowledgeGraphScreen onBack={() => setAdminView('dashboard')} />
      )}

      <HostSettingsModal visible={showHostModal} onClose={() => setShowHostModal(false)} />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" />
            <MainNavigator />
          </SafeAreaView>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    padding: 6,
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface AdminDashboardScreenProps {
  onNavigateModule: (module: 'users' | 'roles' | 'logs' | 'health' | 'graphify') => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onNavigateModule }) => {
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [m, h] = await Promise.allSettled([
        api.users.getDashboardMetrics(),
        api.health.check(),
      ]);
      if (m.status === 'fulfilled') setMetrics(m.value);
      if (h.status === 'fulfilled') setHealth(h.value);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.badgeRow}>
          <Badge label="Admin Console" variant="indigo" />
          <Badge label={user?.role || 'ADMIN'} variant="emerald" />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          System Control Panel
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Signed in as {user?.email}
        </Text>
      </View>

      {/* Metrics Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Metrics</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.grid}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Users</Text>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{metrics?.totalUsers ?? '-'}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Active Accounts</Text>
            <Text style={[styles.metricValue, { color: colors.success }]}>{metrics?.activeUsers ?? '-'}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Inactive Users</Text>
            <Text style={[styles.metricValue, { color: colors.warning }]}>{metrics?.inactiveUsers ?? '-'}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>7-Day Registrations</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{metrics?.registrationsLast7Days ?? '-'}</Text>
          </View>
        </View>
      )}

      {/* Live Services Status */}
      <Card title="Infrastructure Health" subtitle="Real-time multi-model database connectivity">
        <View style={styles.healthRow}>
          <Text style={[styles.healthLabel, { color: colors.text }]}>PostgreSQL (ACID Primary):</Text>
          <Badge
            label={health?.services?.postgres?.status === 'UP' ? 'HEALTHY' : 'CHECKING'}
            variant={health?.services?.postgres?.status === 'UP' ? 'emerald' : 'amber'}
          />
        </View>

        <View style={styles.healthRow}>
          <Text style={[styles.healthLabel, { color: colors.text }]}>MongoDB (Error Telemetry):</Text>
          <Badge
            label={health?.services?.mongodb?.status === 'UP' ? 'HEALTHY' : 'CHECKING'}
            variant={health?.services?.mongodb?.status === 'UP' ? 'emerald' : 'amber'}
          />
        </View>

        <View style={styles.healthRow}>
          <Text style={[styles.healthLabel, { color: colors.text }]}>Valkey / Redis (Cache & Rate Limits):</Text>
          <Badge
            label={health?.services?.valkey?.status === 'UP' ? 'HEALTHY' : 'CHECKING'}
            variant={health?.services?.valkey?.status === 'UP' ? 'emerald' : 'amber'}
          />
        </View>
      </Card>

      {/* Admin Modules Navigation */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Modules</Text>
      <View style={styles.moduleList}>
        <TouchableOpacity
          onPress={() => onNavigateModule('users')}
          style={[styles.moduleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View>
            <Text style={[styles.moduleTitle, { color: colors.text }]}>👥 User Management</Text>
            <Text style={[styles.moduleDesc, { color: colors.textMuted }]}>View, filter, and inspect accounts</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateModule('roles')}
          style={[styles.moduleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View>
            <Text style={[styles.moduleTitle, { color: colors.text }]}>🛡️ Roles & Permissions</Text>
            <Text style={[styles.moduleDesc, { color: colors.textMuted }]}>Inspect 12-permission RBAC hierarchy</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateModule('logs')}
          style={[styles.moduleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View>
            <Text style={[styles.moduleTitle, { color: colors.text }]}>📜 Audit & Activity Logs</Text>
            <Text style={[styles.moduleDesc, { color: colors.textMuted }]}>Structured diffs and trace logs</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateModule('health')}
          style={[styles.moduleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View>
            <Text style={[styles.moduleTitle, { color: colors.text }]}>💓 System Health Probe</Text>
            <Text style={[styles.moduleDesc, { color: colors.textMuted }]}>Latencies and heartbeat monitors</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateModule('graphify')}
          style={[styles.moduleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View>
            <Text style={[styles.moduleTitle, { color: colors.text }]}>🧠 Knowledge Graph</Text>
            <Text style={[styles.moduleDesc, { color: colors.textMuted }]}>AST topology and symbol dependency metrics</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Sign Out of Admin Console" onPress={logout} variant="danger" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  moduleList: {
    gap: 10,
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  moduleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});


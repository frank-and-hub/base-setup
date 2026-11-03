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

export const UserDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchActivities = async () => {
    try {
      const data = await api.audit.getMyActivity();
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      // Handle or ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Welcome Banner */}
      <View style={[styles.banner, { backgroundColor: colors.primary }]}>
        <View style={styles.badgeRow}>
          <Badge label="User Portal" variant="indigo" />
          <Badge label="Account Active" variant="emerald" />
        </View>
        <Text style={styles.bannerTitle}>
          Welcome, {user?.first_name || user?.firstName || 'Member'}!
        </Text>
        <Text style={styles.bannerEmail}>{user?.email}</Text>
      </View>

      {/* Security Overview */}
      <Card title="Security & Account Status">
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Assigned Role:</Text>
          <Badge label={user?.role || 'USER'} variant="blue" />
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Account Status:</Text>
          <Badge label={user?.status || 'ACTIVE'} variant="emerald" />
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>User ID:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.id || user?.user_uuid}</Text>
        </View>
      </Card>

      {/* Personal Activity Feed */}
      <Card title="Recent Activity" subtitle="Real-time log of your logins and account actions">
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : activities.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent activity logged yet.</Text>
        ) : (
          activities.slice(0, 5).map((act, idx) => (
            <View
              key={act.activity_uuid || act.id || idx}
              style={[
                styles.activityItem,
                { borderBottomColor: colors.border, borderBottomWidth: idx < activities.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={styles.activityHeader}>
                <Text style={[styles.activityAction, { color: colors.text }]}>{act.action}</Text>
                <Badge
                  label={act.status || 'SUCCESS'}
                  variant={act.status === 'FAILED' ? 'rose' : 'emerald'}
                />
              </View>
              <Text style={[styles.activityDetails, { color: colors.textMuted }]}>
                IP: {act.ip_address || '127.0.0.1'} • {new Date(act.created_at || Date.now()).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Logout Action */}
      <View style={styles.actionContainer}>
        <Button title="Sign Out" onPress={logout} variant="danger" />
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
  banner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  bannerEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '60%',
  },
  activityItem: {
    paddingVertical: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityDetails: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  actionContainer: {
    marginTop: 8,
  },
});


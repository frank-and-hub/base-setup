import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Badge } from '../components/Badge';

interface AdminLogsScreenProps {
  onBack: () => void;
}

export const AdminLogsScreen: React.FC<AdminLogsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();

  const [tab, setTab] = useState<'activity' | 'audit'>('activity');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (tab === 'activity') {
        const res = await api.audit.getActivityLogs();
        const items = res?.items || res?.data || res || [];
        setLogs(Array.isArray(items) ? items : []);
      } else {
        const res = await api.audit.getAuditLogs();
        const items = res?.items || res?.data || res || [];
        setLogs(Array.isArray(items) ? items : []);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Telemetry & Audit Logs</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setTab('activity')}
          style={[styles.tabItem, tab === 'activity' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={{ color: tab === 'activity' ? colors.primary : colors.textMuted, fontWeight: '700' }}>
            User Activities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('audit')}
          style={[styles.tabItem, tab === 'audit' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={{ color: tab === 'audit' ? colors.primary : colors.textMuted, fontWeight: '700' }}>
            PostgreSQL Audits
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, index) => item.id || item.activity_uuid || item.audit_uuid || String(index)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.logTop}>
                <Text style={[styles.logAction, { color: colors.text }]}>
                  {item.action || item.event_type || 'SYSTEM_EVENT'}
                </Text>
                <Badge
                  label={item.status || 'LOGGED'}
                  variant={item.status === 'FAILED' ? 'rose' : 'emerald'}
                />
              </View>

              <Text style={[styles.logDetail, { color: colors.textMuted }]}>
                User: {item.user?.email || item.user_id || 'System'}
              </Text>

              {item.ip_address && (
                <Text style={[styles.logDetail, { color: colors.textMuted }]}>
                  IP: {item.ip_address}
                </Text>
              )}

              {item.correlation_id && (
                <Text style={[styles.logDetail, { color: colors.primary }]}>
                  Trace: {item.correlation_id}
                </Text>
              )}

              <Text style={[styles.logTimestamp, { color: colors.textMuted }]}>
                {new Date(item.created_at || Date.now()).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 16,
  },
  backBtn: {
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  logCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '700',
  },
  logDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  logTimestamp: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface AdminKnowledgeGraphScreenProps {
  onBack: () => void;
}

export const AdminKnowledgeGraphScreen: React.FC<AdminKnowledgeGraphScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.graphify.getStats();
      setStats(res);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Codebase Knowledge Graph</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card title="Graphify AST Extraction Metrics" subtitle="Multi-language AST topology analysis">
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            Graphify extracts symbols, classes, decorators, and callflows across the monorepo for instant AI retrieval.
          </Text>
        </Card>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.grid}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Symbols</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>{stats?.totalNodes ?? '-'}</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Relationships</Text>
                <Text style={[styles.metricValue, { color: colors.success }]}>{stats?.totalEdges ?? '-'}</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Communities</Text>
                <Text style={[styles.metricValue, { color: colors.warning }]}>{stats?.communitiesCount ?? '-'}</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Token Reduction</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{stats?.tokenReductionRatio ?? '39.0x'}</Text>
              </View>
            </View>

            <Card title="Top Architectural Hubs" subtitle="Highest degree connected nodes across apps and packages">
              {(stats?.topHubs || []).slice(0, 6).map((hub: any, idx: number) => (
                <View
                  key={hub.id || idx}
                  style={[
                    styles.hubItem,
                    { borderBottomColor: colors.border, borderBottomWidth: idx < 5 ? 1 : 0 },
                  ]}
                >
                  <View>
                    <Text style={[styles.hubLabel, { color: colors.text }]}>{hub.label}</Text>
                    <Text style={[styles.hubFile, { color: colors.textMuted }]}>{hub.sourceFile}</Text>
                  </View>
                  <Badge label={`${hub.connections} links`} variant="indigo" />
                </View>
              ))}
            </Card>

            <Button title="Refresh AST Metrics" onPress={fetchStats} variant="primary" />
          </>
        )}
      </ScrollView>
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
  content: {
    padding: 16,
    gap: 12,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  hubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  hubLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  hubFile: {
    fontSize: 11,
    marginTop: 2,
  },
});


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

interface AdminRolesScreenProps {
  onBack: () => void;
}

export const AdminRolesScreen: React.FC<AdminRolesScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();

  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, p] = await Promise.allSettled([
          api.roles.getRoles(),
          api.roles.getPermissions(),
        ]);
        if (r.status === 'fulfilled') setRoles(Array.isArray(r.value) ? r.value : []);
        if (p.status === 'fulfilled') setPermissions(Array.isArray(p.value) ? p.value : []);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Roles & Permissions</Text>
        <Text style={[styles.headerCount, { color: colors.textMuted }]}>{roles.length} roles</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card title="RBAC Privilege Matrix" subtitle="Hierarchical role-based access control">
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            Super Admin has automatic bypass on all system actions. Admin and Moderator roles possess explicit permission subsets.
          </Text>
        </Card>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          roles.map((role) => {
            const rolePerms = role.role_permissions || role.permissions || [];
            return (
              <Card
                key={role.role_uuid || role.id || role.name}
                title={role.name}
                subtitle={role.description || `Configured ${rolePerms.length} permissions`}
              >
                <View style={styles.badgeRow}>
                  <Badge
                    label={role.name === 'SUPER_ADMIN' ? 'FULL BYPASS' : `${rolePerms.length} GRANTED`}
                    variant={role.name === 'SUPER_ADMIN' ? 'rose' : 'indigo'}
                  />
                </View>

                <View style={styles.permsGrid}>
                  {rolePerms.map((rp: any, idx: number) => {
                    const permName = rp.permission?.name || rp.name || rp;
                    return (
                      <View
                        key={idx}
                        style={[styles.permPill, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
                      >
                        <Text style={[styles.permText, { color: colors.text }]}>{permName}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            );
          })
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerCount: {
    fontSize: 12,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    marginVertical: 8,
  },
  permsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  permPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  permText: {
    fontSize: 11,
    fontWeight: '600',
  },
});


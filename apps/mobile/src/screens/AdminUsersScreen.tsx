import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

interface AdminUsersScreenProps {
  onBack: () => void;
}

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.users.getUsers({ page, limit: 10, search });
      const items = res?.items || res?.data || res || [];
      setUsers(Array.isArray(items) ? items : []);
      setTotal(res?.total || res?.meta?.total || items.length);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'rose';
      case 'ADMIN':
        return 'indigo';
      case 'MODERATOR':
        return 'amber';
      default:
        return 'slate';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Management</Text>
        <Text style={[styles.headerCount, { color: colors.textMuted }]}>{total} accounts</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChangeText={(txt) => {
            setSearch(txt);
            setPage(1);
          }}
        />
      </View>

      {/* Users List */}
      {loading && users.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id || item.user_uuid || item.email}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.userTop}>
                <View>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {item.first_name || item.firstName} {item.last_name || item.lastName}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.textMuted }]}>{item.email}</Text>
                </View>
                <Badge label={item.role} variant={getRoleVariant(item.role)} />
              </View>

              <View style={[styles.userBottom, { borderTopColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Status:</Text>
                  <Badge
                    label={item.status || 'ACTIVE'}
                    variant={item.status === 'INACTIVE' ? 'rose' : 'emerald'}
                  />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  Joined: {new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  userTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});


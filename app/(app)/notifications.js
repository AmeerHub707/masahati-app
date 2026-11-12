import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../src/components/ui/EmptyState';
import ErrorBanner from '../../src/components/ui/ErrorBanner';
import Loading from '../../src/components/ui/Loading';
import { useAuth } from '../../src/context/AuthContext';
import {
  loadNotificationsWithFallback,
  markAllNotificationsReadWithFallback,
  readSeenIds,
  writeSeenIds,
} from '../../src/lib/notifications';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/constants/theme';

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await loadNotificationsWithFallback();
    setItems(result.notifications);
    setError(result.error || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const result = await loadNotificationsWithFallback();
      if (!alive) return;
      const seen = new Set(readSeenIds(user?.id));
      const merged = result.notifications.map((n) =>
        seen.has(String(n.id)) ? { ...n, read: true } : n
      );
      setItems(merged);
      setError(result.error || '');
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkAll = async () => {
    const ids = items.map((n) => n.id);
    writeSeenIds(user?.id, ids);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsReadWithFallback();
    } catch (err) {
      setError(err?.message || 'تعذّر تحديث الإشعارات.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="رجوع">
          <Ionicons name="arrow-forward" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>الإشعارات</Text>
        <Pressable onPress={handleMarkAll} hitSlop={8} disabled={!items.length}>
          <Text style={[styles.markAll, !items.length && styles.disabled]}>قراءة الكل</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxl }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.brand}
            colors={[COLORS.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorBanner message={error} onRetry={load} /> : null}

        {loading ? <Loading label="جارٍ تحميل الإشعارات…" /> : null}

        {!loading && items.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="لا توجد إشعارات"
            description="ستظهر هنا تحديثات حجوزاتك وإعلانات المساحات."
          />
        ) : null}

        {items.map((item, index) => (
          <View key={item.id ?? index} style={[styles.card, !item.read && styles.unread]}>
            <View style={styles.cardHead}>
              <View style={styles.cardTitleWrap}>
                {!item.read ? <View style={styles.dot} /> : null}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title || 'إشعار'}
                </Text>
              </View>
              {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
            </View>
            <Text style={styles.body}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  markAll: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.brand,
    writingDirection: 'rtl',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  unread: {
    borderColor: '#F9D6BF',
    backgroundColor: '#FFFBF8',
  },
  cardHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand,
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  time: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  body: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 21,
  },
});

import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import Screen from '../../../src/components/ui/Screen';
import Avatar from '../../../src/components/ui/Avatar';
import Card from '../../../src/components/ui/Card';
import Chip from '../../../src/components/ui/Chip';
import StatCard from '../../../src/components/ui/StatCard';
import SectionHeader from '../../../src/components/ui/SectionHeader';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorBanner from '../../../src/components/ui/ErrorBanner';
import Loading from '../../../src/components/ui/Loading';
import BookingRow from '../../../src/components/ui/BookingRow';
import { useAuth } from '../../../src/context/AuthContext';
import { useDashboard } from '../../../src/context/DashboardContext';
import { loadNotificationsWithFallback, readSeenIds } from '../../../src/lib/notifications';
import { fmtNumber } from '../../../src/lib/format';
import { BRAND_GRADIENT, COLORS, FONT, RADIUS, SPACING } from '../../../src/constants/theme';

function openAd(ad) {
  if (typeof ad?.link === 'string' && /^https?:\/\//i.test(ad.link)) {
    Linking.openURL(ad.link).catch(() => {});
  }
}

export default function Home() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { data, status, error, refreshing, refresh, reload } = useDashboard();
  const [showAll, setShowAll] = useState(false);
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadNotificationsWithFallback().then(({ notifications }) => {
        if (!alive) return;
        const seen = new Set(readSeenIds(authUser?.id));
        setUnread(notifications.filter((n) => !n.read && !seen.has(String(n.id))).length);
      });
      return () => {
        alive = false;
      };
    }, [authUser?.id])
  );

  const user = data?.user || authUser || {};
  const stats = data?.stats || {};
  const newSpaces = Array.isArray(data?.newSpaces) ? data.newSpaces : [];
  const ads = Array.isArray(data?.ads) ? data.ads : [];
  const upcoming = (data?.upcoming || []).filter((b) => b.status !== 'cancelled');
  const visibleUpcoming = showAll ? upcoming : upcoming.slice(0, 2);
  const roleLabel = user.role === 'owner' ? 'صاحب مساحة' : 'عميل';

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.topbar}>
        <Text style={styles.brandName}>مساحاتي</Text>
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={10}
          style={styles.bell}
          accessibilityLabel="الإشعارات"
        >
          <Ionicons name="notifications-outline" size={23} color={COLORS.text} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{fmtNumber(unread)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {status === 'loading' && !data ? <Loading label="جارٍ تحميل لوحتك…" /> : null}

      {status === 'error' && !data ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="تعذّر تحميل البيانات"
          description="تحقق من اتصالك بالإنترنت ثم أعد المحاولة."
          actionLabel="إعادة المحاولة"
          onAction={reload}
        />
      ) : null}

      {data ? (
        <>
          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Avatar uri={user.photo} name={user.name} size={58} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {user.name ? `أهلاً، ${user.name}` : 'أهلاً بك'}
              </Text>
              <Text style={styles.heroDesc} numberOfLines={2}>
                حجوزاتك ومساحاتك المفضّلة في مكان واحد.
              </Text>
              <View style={styles.rolePill}>
                <Ionicons name="star" size={12} color={COLORS.white} />
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            <StatCard icon="calendar-outline" value={stats.upcomingBookings} label="حجوزات قادمة" />
            <StatCard icon="time-outline" value={stats.hoursThisMonth} label="ساعات هذا الشهر" />
            <StatCard icon="heart-outline" value={stats.savedFavorites} label="مساحات محفوظة" />
            <StatCard icon="timer-outline" value={stats.hoursSpentThisMonth} label="ساعات محجوزة" />
          </View>

          {newSpaces.length > 0 ? (
            <>
              <SectionHeader title="مساحات جديدة" icon="sparkles-outline" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hStrip}
              >
                {newSpaces.map((space) => (
                  <Card key={space.id} style={styles.spaceCard}>
                    <View style={styles.newPill}>
                      <Text style={styles.newPillText}>جديد</Text>
                    </View>
                    <Text style={styles.spaceTitle} numberOfLines={2}>
                      {space.title || 'مساحة'}
                    </Text>
                    <Text style={styles.spaceArea} numberOfLines={1}>
                      {space.area || space.location || '—'}
                    </Text>
                    <Text style={styles.spacePrice}>
                      {fmtNumber(space.price_per_hour)} ش.ج
                      <Text style={styles.perHour}> / ساعة</Text>
                    </Text>
                  </Card>
                ))}
              </ScrollView>
            </>
          ) : null}

          {ads.length > 0 ? (
            <>
              <SectionHeader title="إعلانات" icon="megaphone-outline" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hStrip}
              >
                {ads.map((ad) => (
                  <Pressable key={ad.id} onPress={() => openAd(ad)} style={styles.adPill}>
                    <Chip label={ad.tag || 'عرض'} tone="brand" />
                    <Text style={styles.adTitle} numberOfLines={1}>
                      {ad.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionHeader
            title="حجوزاتك القادمة"
            icon="calendar-outline"
            actionLabel={upcoming.length > 2 ? (showAll ? 'عرض أقل' : 'عرض الكل') : undefined}
            onAction={() => setShowAll((v) => !v)}
          />

          {visibleUpcoming.length > 0 ? (
            visibleUpcoming.map((booking, index) => (
              <BookingRow
                key={booking.id ?? `${booking.spaceName}-${booking.date}-${index}`}
                booking={booking}
              />
            ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="لا توجد حجوزات بعد"
              description="ستظهر هنا حجوزاتك القادمة بمجرد إتمام أول حجز."
            />
          )}

          <SectionHeader title="اختصارات" icon="grid-outline" />
          <Card style={styles.comingSoon}>
            <View style={styles.comingIcon}>
              <Ionicons name="compass-outline" size={22} color={COLORS.brand} />
            </View>
            <View style={styles.comingCopy}>
              <Text style={styles.comingTitle}>تصفّح المساحات</Text>
              <Text style={styles.comingDesc}>
                التصفح والحجز من التطبيق سيتوفران في التحديث القادم.
              </Text>
            </View>
          </Card>

          <View style={styles.footerSpace} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  brandName: {
    fontSize: FONT.lg,
    fontWeight: '900',
    color: COLORS.brand,
    writingDirection: 'rtl',
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  hero: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroDesc: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rolePill: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.white,
    writingDirection: 'rtl',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  hStrip: {
    gap: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  spaceCard: {
    width: 200,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  newPill: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.brandSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.xs,
  },
  newPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.brand,
    writingDirection: 'rtl',
  },
  spaceTitle: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    minHeight: 40,
  },
  spaceArea: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  spacePrice: {
    marginTop: SPACING.xs,
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.brand,
    textAlign: 'right',
  },
  perHour: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  adPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxWidth: 280,
  },
  adTitle: {
    flexShrink: 1,
    fontSize: FONT.sm,
    fontWeight: '600',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  comingSoon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
  },
  comingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingCopy: {
    flex: 1,
    gap: 2,
  },
  comingTitle: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  comingDesc: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footerSpace: {
    height: SPACING.xl,
  },
});

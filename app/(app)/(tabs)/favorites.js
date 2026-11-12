import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import SectionHeader from '../../../src/components/ui/SectionHeader';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorBanner from '../../../src/components/ui/ErrorBanner';
import Loading from '../../../src/components/ui/Loading';
import { useDashboard } from '../../../src/context/DashboardContext';
import { fmtNumber, fmtRating } from '../../../src/lib/format';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../../src/constants/theme';

export default function Favorites() {
  const { data, status, error, refreshing, refresh, reload, toggleFavorite, togglingId } =
    useDashboard();

  const favorites = data?.favorites || [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={styles.pageTitle}>المساحات المفضّلة</Text>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {status === 'loading' && !data ? <Loading label="جارٍ تحميل المفضّلة…" /> : null}

      {status === 'error' && !data ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="تعذّر تحميل المفضّلة"
          description="تحقق من اتصالك بالإنترنت ثم أعد المحاولة."
          actionLabel="إعادة المحاولة"
          onAction={reload}
        />
      ) : null}

      {data ? (
        <>
          <SectionHeader title={`المحفوظة (${favorites.length})`} icon="heart-outline" />
          {favorites.length > 0 ? (
            favorites.map((space) => (
              <View key={space.id} style={styles.card}>
                {space.image ? (
                  <Image source={{ uri: space.image }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Ionicons name="business-outline" size={24} color={COLORS.brand} />
                  </View>
                )}

                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={1}>
                    {space.name || 'مساحة'}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.meta}>
                      <Ionicons name="star" size={13} color={COLORS.warning} />
                      <Text style={styles.metaText}>{fmtRating(space.rating)}</Text>
                    </View>
                    {space.location ? (
                      <View style={styles.meta}>
                        <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {space.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.price}>
                    {fmtNumber(space.pricePerHour)} ش.ج
                    <Text style={styles.perHour}> / ساعة</Text>
                  </Text>
                </View>

                <Pressable
                  onPress={() => toggleFavorite(space.id, space.name)}
                  disabled={togglingId === space.id}
                  hitSlop={8}
                  style={styles.heart}
                  accessibilityLabel="إزالة من المفضّلة"
                >
                  <Ionicons
                    name="heart"
                    size={22}
                    color={togglingId === space.id ? COLORS.placeholder : COLORS.brand}
                  />
                </Pressable>
              </View>
            ))
          ) : (
            <EmptyState
              icon="heart-outline"
              title="لا مفضّلات بعد"
              description="أضف المساحات التي تعجبك إلى المفضّلة لتعود إليها بسرعة."
            />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: SPACING.lg,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brandSoft,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  metaText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  price: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
  },
  perHour: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  heart: {
    padding: SPACING.xs,
  },
});

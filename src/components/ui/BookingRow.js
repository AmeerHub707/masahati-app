import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { fmtNumber } from '../../lib/format';
import Chip from './Chip';

const STATUS_META = {
  confirmed: { label: 'مؤكد', tone: 'success' },
  pending: { label: 'قيد التأكيد', tone: 'warning' },
  cancelled: { label: 'ملغى', tone: 'danger' },
  completed: { label: 'مكتمل', tone: 'info' },
};

export default function BookingRow({ booking, onCancel, cancelling = false }) {
  const status = STATUS_META[booking.status] || { label: booking.status || 'حجز', tone: 'neutral' };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        {booking.image ? (
          <Image source={{ uri: booking.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="business-outline" size={22} color={COLORS.brand} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.spaceName || 'مساحة'}
          </Text>
          <View style={styles.metaRow}>
            {booking.date ? (
              <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{booking.date}</Text>
              </View>
            ) : null}
            {booking.time ? (
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{booking.time}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Chip label={status.label} tone={status.tone} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>
          {fmtNumber(booking.price)} <Text style={styles.currency}>ش.ج</Text>
        </Text>
        {onCancel && booking.status !== 'cancelled' ? (
          <Pressable onPress={() => onCancel(booking.id)} disabled={cancelling} hitSlop={8}>
            <Text style={[styles.cancel, cancelling && styles.cancelDisabled]}>
              {cancelling ? 'جارٍ…' : 'إلغاء الحجز'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  top: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
  },
  image: {
    width: 54,
    height: 54,
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
  title: {
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
    gap: 4,
  },
  metaText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  price: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.text,
  },
  currency: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  cancel: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.danger,
    writingDirection: 'rtl',
  },
  cancelDisabled: {
    opacity: 0.5,
  },
});

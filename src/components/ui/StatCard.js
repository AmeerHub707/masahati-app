import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { fmtNumber } from '../../lib/format';

export default function StatCard({ icon, value, label }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={COLORS.brand} />
      </View>
      <Text style={styles.value}>{fmtNumber(value)}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    alignSelf: 'flex-end',
  },
  value: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
  },
  label: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

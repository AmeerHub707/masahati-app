import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING } from '../../constants/theme';

export default function SectionHeader({ title, icon, actionLabel, onAction }) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        {icon ? <Ionicons name={icon} size={18} color={COLORS.brand} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  titleWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  action: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.brand,
    writingDirection: 'rtl',
  },
});

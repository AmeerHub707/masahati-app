import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';

export default function ErrorBanner({ message, onRetry, tone = 'danger' }) {
  if (!message) return null;
  const isInfo = tone === 'info';
  const palette = isInfo
    ? { bg: COLORS.infoSoft, fg: COLORS.info, border: '#B2DDFF' }
    : { bg: COLORS.dangerSoft, fg: COLORS.danger, border: '#FECDCA' };

  return (
    <View
      style={[styles.wrap, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityRole="alert"
    >
      <Ionicons name={isInfo ? 'information-circle-outline' : 'alert-circle-outline'} size={18} color={palette.fg} />
      <Text style={[styles.text, { color: palette.fg }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8} style={styles.retry}>
          <Ionicons name="refresh" size={16} color={palette.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  text: {
    flex: 1,
    fontSize: FONT.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  retry: {
    padding: SPACING.xs,
  },
});

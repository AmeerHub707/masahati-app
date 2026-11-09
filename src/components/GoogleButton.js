import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';

export default function GoogleButton({ onPress, loading = false, title = 'المتابعة باستخدام Google' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <>
          <Text style={styles.glyph}>G</Text>
          <Text style={styles.label}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  pressed: {
    backgroundColor: COLORS.inputBg,
  },
  disabled: {
    opacity: 0.6,
  },
  glyph: {
    fontSize: 21,
    fontWeight: '800',
    color: '#4285F4',
    lineHeight: 24,
  },
  label: {
    fontSize: FONT.base,
    fontWeight: '600',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
});

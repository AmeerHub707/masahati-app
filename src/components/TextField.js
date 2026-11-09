import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';

export default function TextField({ label, error, style, ...props }) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={COLORS.placeholder}
        textAlign="right"
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    height: 54,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT.md,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  error: {
    marginTop: SPACING.xs,
    fontSize: FONT.xs,
    color: COLORS.danger,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

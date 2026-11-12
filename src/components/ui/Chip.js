import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';

const TONES = {
  brand: { bg: COLORS.brandSoft, fg: COLORS.brand },
  success: { bg: COLORS.successSoft, fg: COLORS.success },
  warning: { bg: COLORS.warningSoft, fg: COLORS.warning },
  danger: { bg: COLORS.dangerSoft, fg: COLORS.danger },
  info: { bg: COLORS.infoSoft, fg: COLORS.info },
  neutral: { bg: COLORS.inputBg, fg: COLORS.textMuted },
};

export default function Chip({ label, tone = 'neutral', style }) {
  const palette = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  label: {
    fontSize: FONT.xs,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});

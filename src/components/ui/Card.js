import { StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../constants/theme';

export default function Card({ children, style, padded = true }) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  padded: {
    padding: SPACING.lg,
  },
});

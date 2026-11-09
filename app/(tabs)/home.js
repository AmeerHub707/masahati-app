import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, SPACING } from '../../src/constants/theme';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>الرئيسية</Text>
      <Text style={styles.hint}>ستظهر هنا المساحات المتاحة للحجز</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  hint: {
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

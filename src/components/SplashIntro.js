import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../constants/theme';

// Trimmed artwork (ink-only), so the visual centre is the box centre.
const M_LOGO = require('../../assets/images/Mlogo-trim.png');
const WORDMARK = require('../../assets/images/Logo-trim.png');

const M_ASPECT = 401 / 443; // height / width
const LOGO_ASPECT = 375 / 1504;

const TIMINGS = {
  mEnter: 650,
  mHold: 300,
  mExit: 250,
  logoEnter: 700,
  logoFadeIn: 600,
  screenFade: 250,
};

function timing(value, toValue, duration, easing) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: easing ?? Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

export default function SplashIntro({ onFinish }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigated = useRef(false);
  const animation = useRef(null);

  const mWidth = Math.min(200, width * 0.48);
  const mHeight = mWidth * M_ASPECT;
  const logoWidth = Math.min(320, width * 0.78);
  const logoHeight = logoWidth * LOGO_ASPECT;

  const mLeft = (width - mWidth) / 2;
  const mTop = (height - mHeight) / 2;
  const logoLeft = (width - logoWidth) / 2;
  const logoTop = (height - logoHeight) / 2;

  const mY = useRef(new Animated.Value(mHeight + 140)).current;
  const mOpacity = useRef(new Animated.Value(0)).current;
  const logoX = useRef(new Animated.Value(-(width / 2 + logoWidth / 2 + 40))).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const goToAuth = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    const intro = Animated.sequence([
      // 1. M rises from the bottom to the exact centre of the screen
      Animated.parallel([timing(mY, 0, TIMINGS.mEnter), timing(mOpacity, 1, TIMINGS.mEnter)]),
      // 2. hold, then disappear
      Animated.delay(TIMINGS.mHold),
      timing(mOpacity, 0, TIMINGS.mExit),
      // 3. wordmark slides in from the left
      Animated.parallel([
        timing(logoX, 0, TIMINGS.logoEnter),
        timing(logoOpacity, 1, TIMINGS.logoFadeIn),
      ]),
      // 4. fade out into auth
      timing(screenOpacity, 0, TIMINGS.screenFade, Easing.in(Easing.quad)),
    ]);

    animation.current = intro;

    intro.start(({ finished }) => {
      if (finished) {
        goToAuth();
      }
    });

    return () => intro.stop();
  }, [goToAuth, logoOpacity, logoX, mOpacity, mY, screenOpacity]);

  const handleSkip = useCallback(() => {
    animation.current?.stop();
    goToAuth();
  }, [goToAuth]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.Image
        source={WORDMARK}
        resizeMode="contain"
        pointerEvents="none"
        style={[
          styles.image,
          {
            left: logoLeft,
            top: logoTop,
            width: logoWidth,
            height: logoHeight,
            opacity: logoOpacity,
            transform: [{ translateX: logoX }],
          },
        ]}
      />

      <Animated.Image
        source={M_LOGO}
        resizeMode="contain"
        pointerEvents="none"
        style={[
          styles.image,
          {
            left: mLeft,
            top: mTop,
            width: mWidth,
            height: mHeight,
            opacity: mOpacity,
            transform: [{ translateY: mY }],
          },
        ]}
      />

      <Pressable
        onPress={handleSkip}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="تخطي المقدمة"
        style={[styles.skip, { top: insets.top + SPACING.md }]}
      >
        <Text style={styles.skipText}>تخطي</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  skip: {
    position: 'absolute',
    right: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    fontSize: FONT.base,
    fontWeight: '600',
    color: 'rgba(17, 24, 39, 0.55)',
    writingDirection: 'rtl',
  },
});

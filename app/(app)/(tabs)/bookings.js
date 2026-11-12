import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Screen from '../../../src/components/ui/Screen';
import SectionHeader from '../../../src/components/ui/SectionHeader';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorBanner from '../../../src/components/ui/ErrorBanner';
import Loading from '../../../src/components/ui/Loading';
import BookingRow from '../../../src/components/ui/BookingRow';
import { useDashboard } from '../../../src/context/DashboardContext';
import { cancelBooking } from '../../../src/lib/dashboard';
import { COLORS, FONT, RADIUS, SPACING } from '../../../src/constants/theme';

export default function Bookings() {
  const { data, status, error, refreshing, refresh, reload } = useDashboard();
  const [notice, setNotice] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const bookings = data?.bookings || [];

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      const result = await cancelBooking(id);
      const message = result?.message || 'تعذّر إلغاء الحجز.';
      setNotice(result?.ok ? '' : message);
      Alert.alert('إلغاء الحجز', message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={styles.pageTitle}>حجوزاتي</Text>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {status === 'loading' && !data ? <Loading label="جارٍ تحميل الحجوزات…" /> : null}

      {status === 'error' && !data ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="تعذّر تحميل الحجوزات"
          description="تحقق من اتصالك بالإنترنت ثم أعد المحاولة."
          actionLabel="إعادة المحاولة"
          onAction={reload}
        />
      ) : null}

      {data ? (
        <>
          <SectionHeader title={`كل الحجوزات (${bookings.length})`} icon="calendar-outline" />
          {bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <BookingRow
                key={booking.id ?? `${booking.spaceName}-${booking.date}-${index}`}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancellingId === booking.id}
              />
            ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="لا توجد حجوزات بعد"
              description="ابدأ بتصفح المساحات المتاحة واحجز مساحتك الأولى."
            />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: SPACING.lg,
  },
  notice: {
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noticeText: {
    fontSize: FONT.sm,
    color: '#B54708',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

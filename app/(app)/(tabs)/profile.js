import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Screen from '../../../src/components/ui/Screen';
import Card from '../../../src/components/ui/Card';
import Avatar from '../../../src/components/ui/Avatar';
import Chip from '../../../src/components/ui/Chip';
import Button from '../../../src/components/Button';
import TextField from '../../../src/components/TextField';
import { useAuth } from '../../../src/context/AuthContext';
import { useDashboard } from '../../../src/context/DashboardContext';
import {
  updateProfile,
  uploadPicture,
  updateProfilePicture,
  deleteUser,
} from '../../../src/lib/authStore';
import {
  extractPicturePath,
  getCachedPictureUrl,
  resolveNewPictureUrl,
  validateAsset,
} from '../../../src/lib/profilePicture';
import { COLORS, FONT, RADIUS, SPACING } from '../../../src/constants/theme';

function messageOf(err) {
  return err?.message || 'تعذّر إكمال العملية. حاول مجدداً.';
}

export default function Profile() {
  const router = useRouter();
  const { user: authUser, signOut, updateUser } = useAuth();
  const { data, applyUserPatch } = useDashboard();
  const user = data?.user || authUser || {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const source = data?.user || authUser;
    if (!source) return;
    initialized.current = true;
    setName(source.full_name || source.name || '');
    setPhone(source.phone || '');
    setEmail(source.email || '');
  }, [data?.user, authUser]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('الإذن مطلوب', 'نحتاج إذن الوصول إلى الصور لاختيار صورة الحساب.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets?.[0];
    const invalid = validateAsset(asset);
    if (invalid) {
      Alert.alert('صورة غير صالحة', invalid);
      return;
    }

    setUploading(true);
    try {
      const hasPhoto = Boolean(data?.user?.photo || getCachedPictureUrl());
      const response = hasPhoto
        ? await updateProfilePicture(asset)
        : await uploadPicture(asset);
      const rawPath = extractPicturePath(response);
      if (!rawPath) throw new Error('لم يُرجع الخادم رابط الصورة.');
      const picture = resolveNewPictureUrl(rawPath);
      updateUser({ photo: picture, picture });
      applyUserPatch({ photo: picture, picture });
      Alert.alert('تم', 'تم تحديث صورة الحساب.');
    } catch (err) {
      Alert.alert('تعذّر رفع الصورة', messageOf(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'أدخل الاسم الكامل.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      const patch = { name: name.trim(), full_name: name.trim(), phone: phone.trim(), email: email.trim() };
      updateUser(patch);
      applyUserPatch(patch);
      Alert.alert('تم', 'تم تحديث بياناتك.');
    } catch (err) {
      Alert.alert('تعذّر الحفظ', messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من حسابك؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'حذف الحساب نهائياً؟',
      'سيتم حذف جميع بياناتك وحجوزاتك من المنصة نهائياً. هذا الإجراء لا يمكن التراجع عنه.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذف حسابي',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteUser();
            } catch (err) {
              Alert.alert('تعذّر الحذف', messageOf(err));
              setDeleting(false);
              return;
            }
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Text style={styles.pageTitle}>حسابي</Text>

      <Card style={styles.identity}>
        <Pressable onPress={handlePickImage} disabled={uploading} style={styles.avatarWrap}>
          <Avatar uri={user.photo} name={user.name || user.full_name} size={88} />
          <View style={styles.cameraBadge}>
            <Ionicons name={uploading ? 'hourglass-outline' : 'camera-outline'} size={14} color={COLORS.white} />
          </View>
        </Pressable>
        <Text style={styles.userName}>{user.name || user.full_name || 'مستخدم مساحاتي'}</Text>
        <Text style={styles.userEmail}>{user.email || '—'}</Text>
        <Chip
          label={user.role === 'owner' ? 'صاحب مساحة' : 'عميل'}
          tone="brand"
          style={styles.roleChip}
        />
        <Pressable onPress={handlePickImage} disabled={uploading} hitSlop={8}>
          <Text style={styles.changePhoto}>{uploading ? 'جارٍ رفع الصورة…' : 'تغيير الصورة'}</Text>
        </Pressable>
      </Card>

      <Text style={styles.sectionTitle}>البيانات الشخصية</Text>
      <Card>
        <TextField label="الاسم الكامل" value={name} onChangeText={setName} placeholder="الاسم الكامل" />
        <TextField
          label="رقم الهاتف"
          value={phone}
          onChangeText={setPhone}
          placeholder="05XXXXXXXX"
          keyboardType="phone-pad"
        />
        <TextField
          label="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="حفظ التعديلات" onPress={handleSave} loading={saving} />
      </Card>

      <Text style={styles.sectionTitle}>الحساب</Text>
      <Card padded={false}>
        <Pressable onPress={handleLogout} style={styles.row} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={COLORS.text} />
          <Text style={styles.rowText}>تسجيل الخروج</Text>
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={styles.row}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          <Text style={[styles.rowText, styles.dangerText]}>
            {deleting ? 'جارٍ حذف الحساب…' : 'حذف الحساب'}
          </Text>
        </Pressable>
      </Card>

      <Text style={styles.version}>مساحاتي · الإصدار 1.0.0</Text>
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
  identity: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xl,
  },
  avatarWrap: {
    marginBottom: SPACING.sm,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  userEmail: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
  },
  roleChip: {
    marginTop: SPACING.xs,
    alignSelf: 'center',
  },
  changePhoto: {
    marginTop: SPACING.sm,
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.brand,
    writingDirection: 'rtl',
  },
  sectionTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  rowText: {
    flex: 1,
    fontSize: FONT.base,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dangerText: {
    color: COLORS.danger,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  version: {
    marginTop: SPACING.xxl,
    textAlign: 'center',
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
});

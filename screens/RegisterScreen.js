import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import FormInput from '../components/FormInput';
import GenderRadioGroup from '../components/GenderRadioGroup';
import ErrorDialog from '../components/Error/ErrorDialog';
import { requestOtpSignup } from '../apis/auth.api';
import { validateField } from '../utils/validation';

const RegisterScreen = ({ navigation }) => {
  const theme = useTheme();

  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    email: '',
    passWord: '',
    confirmPassword: '',
    gender: 'male',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, { ...form, [name]: value }),
    }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, form[name], form);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleRegister = async () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      newErrors[key] = validateField(key, form[key], form);
    });
    setErrors(newErrors);
    setTouched(
      Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    const hasError = Object.values(newErrors).some((error) => error);
    if (hasError) return;

    try {
      setLoading(true);
      const { confirmPassword, ...formData } = form;
      await requestOtpSignup(formData);

      navigation.navigate('OTPScreen', {
        phoneNumber: form.phoneNumber,
        isSignup: true,
      });
    } catch (err) {
      setDialogMessage(err.message || 'Đã xảy ra lỗi');
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Đăng ký</Text>

        <FormInput
          label="Họ và tên"
          value={form.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
          onBlur={() => handleBlur('fullName')}
          error={errors.fullName}
          touched={touched.fullName}
        />

        <FormInput
          label="Tên người dùng"
          value={form.userName}
          onChangeText={(text) => handleChange('userName', text)}
          onBlur={() => handleBlur('userName')}
          error={errors.userName}
          touched={touched.userName}
        />

        <FormInput
          label="Số điện thoại"
          value={form.phoneNumber}
          keyboardType="phone-pad"
          onChangeText={(text) => handleChange('phoneNumber', text)}
          onBlur={() => handleBlur('phoneNumber')}
          error={errors.phoneNumber}
          touched={touched.phoneNumber}
        />

        <FormInput
          label="Email"
          value={form.email}
          keyboardType="email-address"
          onChangeText={(text) => handleChange('email', text)}
          onBlur={() => handleBlur('email')}
          error={errors.email}
          touched={touched.email}
        />

        <FormInput
          label="Mật khẩu"
          value={form.passWord}
          secureTextEntry
          onChangeText={(text) => handleChange('passWord', text)}
          onBlur={() => handleBlur('passWord')}
          error={errors.passWord}
          touched={touched.passWord}
        />

        <FormInput
          label="Xác nhận mật khẩu"
          value={form.confirmPassword}
          secureTextEntry
          onChangeText={(text) => handleChange('confirmPassword', text)}
          onBlur={() => handleBlur('confirmPassword')}
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
        />

        <GenderRadioGroup
          value={form.gender}
          onValueChange={(value) => handleChange('gender', value)}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          buttonColor={theme.colors.primary}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : 'Đăng ký'}
        </Button>

        <Button
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 8 }}
        >
          Đã có tài khoản? Đăng nhập
        </Button>

        <ErrorDialog
          visible={dialogVisible}
          message={dialogMessage}
          onDismiss={() => setDialogVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingVertical:45
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 12,
    borderRadius: 8,
  },
});

export default RegisterScreen;

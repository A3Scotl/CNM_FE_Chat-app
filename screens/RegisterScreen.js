import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme, RadioButton, HelperText } from 'react-native-paper';
import { register } from '../apis/auth.api';
import { useNavigation } from '@react-navigation/native';
export default function RegisterScreen() {
  const   navigation = useNavigation();
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
  const [errors, setErrors] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    email: '',
    passWord: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({
    fullName: false,
    userName: false,
    phoneNumber: false,
    email: false,
    passWord: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const patterns = {
    fullName: /^[a-zA-ZÀ-ỹ\s]{6,}$/,
    userName: /^[a-zA-Z0-9_]{4,}$/,
    phoneNumber: /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    passWord: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Họ và tên là bắt buộc';
        else if (!patterns.fullName.test(value)) error = 'Họ và tên phải có ít nhất 6 ký tự và chỉ chứa chữ cái';
        break;
      case 'userName':
        if (!value.trim()) error = 'Tên người dùng là bắt buộc';
        else if (!patterns.userName.test(value)) error = 'Tên người dùng phải có ít nhất 4 ký tự và chỉ chứa chữ cái, số và dấu gạch dưới';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Số điện thoại là bắt buộc';
        else if (!patterns.phoneNumber.test(value)) error = 'Số điện thoại không hợp lệ (VD: 0987654321 hoặc +84987654321)';
        break;
      case 'email':
        if (!value.trim()) error = 'Email là bắt buộc';
        else if (!patterns.email.test(value)) error = 'Email không hợp lệ (VD: example@gmail.com)';
        break;
      case 'passWord':
        if (!value.trim()) error = 'Mật khẩu là bắt buộc';
        else if (!patterns.passWord.test(value)) error = 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm cả chữ và số';
        break;
      case 'confirmPassword':
        if (!value.trim()) error = 'Xác nhận mật khẩu là bắt buộc';
        else if (value !== form.passWord) error = 'Mật khẩu không khớp';
        break;
      default:
        break;
    }

    return error;
  };

  const handleBlur = (name) => {
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, form[name]);
    setErrors({ ...errors, [name]: error });
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(form).forEach(key => {
      if (key !== 'gender') {
        const error = validateField(key, form[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    const allTouched = {};
    Object.keys(touched).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await register(form);

      if (response?.success) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');

        setForm({
          fullName: '',
          userName: '',
          phoneNumber: '',
          email: '',
          passWord: '',
          confirmPassword: '',
          gender: 'male',
        });

        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        alert(response?.message || 'Đăng ký không thành công');
      }
    } catch (error) {
      if (error.response?.data?.conflicts) {
        const { conflicts } = error.response.data;
        const newErrors = {};

        if (conflicts.userName) newErrors.userName = 'Tên người dùng đã tồn tại';
        if (conflicts.email) newErrors.email = 'Email đã được sử dụng';
        if (conflicts.phoneNumber) newErrors.phoneNumber = 'Số điện thoại đã được đăng ký';

        setErrors(prev => ({ ...prev, ...newErrors }));
        alert(Object.values(newErrors).join('\n'));
      } else {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Đăng ký</Text>

        <TextInput
          label="Họ và tên *"
          mode="outlined"
          value={form.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
          onBlur={() => handleBlur('fullName')}
          style={styles.input}
          error={!!errors.fullName && touched.fullName}
        />
        <HelperText type="error" visible={!!errors.fullName && touched.fullName}>
          {errors.fullName}
        </HelperText>

        <TextInput
          label="Tên người dùng *"
          mode="outlined"
          value={form.userName}
          onChangeText={(text) => handleChange('userName', text)}
          onBlur={() => handleBlur('userName')}
          style={styles.input}
          error={!!errors.userName && touched.userName}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={!!errors.userName && touched.userName}>
          {errors.userName}
        </HelperText>

        <TextInput
          label="Số điện thoại *"
          mode="outlined"
          value={form.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          onBlur={() => handleBlur('phoneNumber')}
          keyboardType="phone-pad"
          style={styles.input}
          error={!!errors.phoneNumber && touched.phoneNumber}
        />
        <HelperText type="error" visible={!!errors.phoneNumber && touched.phoneNumber}>
          {errors.phoneNumber}
        </HelperText>

        <TextInput
          label="Email *"
          mode="outlined"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
          onBlur={() => handleBlur('email')}
          keyboardType="email-address"
          style={styles.input}
          error={!!errors.email && touched.email}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={!!errors.email && touched.email}>
          {errors.email}
        </HelperText>

        <TextInput
          label="Mật khẩu *"
          mode="outlined"
          value={form.passWord}
          onChangeText={(text) => handleChange('passWord', text)}
          onBlur={() => handleBlur('passWord')}
          secureTextEntry
          style={styles.input}
          error={!!errors.passWord && touched.passWord}
        />
        <HelperText type="error" visible={!!errors.passWord && touched.passWord}>
          {errors.passWord}
        </HelperText>

        <TextInput
          label="Xác nhận mật khẩu *"
          mode="outlined"
          value={form.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          onBlur={() => handleBlur('confirmPassword')}
          secureTextEntry
          style={styles.input}
          error={!!errors.confirmPassword && touched.confirmPassword}
        />
        <HelperText type="error" visible={!!errors.confirmPassword && touched.confirmPassword}>
          {errors.confirmPassword}
        </HelperText>

        <Text style={styles.genderLabel}>Giới tính</Text>
        <RadioButton.Group
          onValueChange={(value) => handleChange('gender', value)}
          value={form.gender}
        >
          <View style={styles.radioRow}>
            <RadioButton.Item label="Nam" value="male" />
            <RadioButton.Item label="Nữ" value="female" />
          </View>
        </RadioButton.Group>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          contentStyle={styles.buttonContent}
        >
          Đăng ký
        </Button>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <Text
            style={[styles.loginLink, { color: theme.colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            Đăng nhập
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 4,
  },
  genderLabel: {
    marginTop: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 6,
  },
  buttonContent: {
    height: 44,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
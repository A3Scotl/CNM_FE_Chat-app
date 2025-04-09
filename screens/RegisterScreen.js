import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme, RadioButton, HelperText } from 'react-native-paper';
import { register } from '../apis/auth.api';
import { handleApiError } from '../utils/handleApiError';

export default function RegisterScreen({ navigation }) {
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
  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Họ và tên là bắt buộc';
        else if (value.length < 6) error = 'Họ và tên phải có ít nhất 6 ký tự';
        break;
      case 'userName':
        if (!value.trim()) error = 'Tên người dùng là bắt buộc';
        else if (value.length < 4) error = 'Tên người dùng phải có ít nhất 4 ký tự';
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) error = 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Số điện thoại là bắt buộc';
        else if (!/^(0|\+84)[0-9]{9,10}$/.test(value)) error = 'Số điện thoại không hợp lệ';
        break;
      case 'email':
        if (!value.trim()) error = 'Email là bắt buộc';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email không hợp lệ';
        break;
      case 'passWord':
        if (!value.trim()) error = 'Mật khẩu là bắt buộc';
        else if (value.length < 6) error = 'Mật khẩu phải có ít nhất 6 ký tự';
        break;
      case 'confirmPassword':
        if (value !== form.passWord) error = 'Mật khẩu không khớp';
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(form).forEach(key => {
      if (key !== 'gender') { // Skip gender validation
        const error = validateField(key, form[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(form);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigation.replace('Login');
    } catch (error) {
      const message = handleApiError(error);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Đăng ký</Text>

        <TextInput
          label="Họ và tên"
          mode="outlined"
          value={form.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
          style={styles.input}
          error={!!errors.fullName}
        />
        <HelperText type="error" visible={!!errors.fullName}>
          {errors.fullName}
        </HelperText>

        <TextInput
          label="Tên người dùng"
          mode="outlined"
          value={form.userName}
          onChangeText={(text) => handleChange('userName', text)}
          style={styles.input}
          error={!!errors.userName}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={!!errors.userName}>
          {errors.userName}
        </HelperText>

        <TextInput
          label="Số điện thoại"
          mode="outlined"
          value={form.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          keyboardType="phone-pad"
          style={styles.input}
          error={!!errors.phoneNumber}
        />
        <HelperText type="error" visible={!!errors.phoneNumber}>
          {errors.phoneNumber}
        </HelperText>

        <TextInput
          label="Email"
          mode="outlined"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          style={styles.input}
          error={!!errors.email}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email}
        </HelperText>

        <TextInput
          label="Mật khẩu"
          mode="outlined"
          value={form.passWord}
          onChangeText={(text) => handleChange('passWord', text)}
          secureTextEntry
          style={styles.input}
          error={!!errors.passWord}
        />
        <HelperText type="error" visible={!!errors.passWord}>
          {errors.passWord}
        </HelperText>

        <TextInput
          label="Xác nhận mật khẩu"
          mode="outlined"
          value={form.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          secureTextEntry
          style={styles.input}
          error={!!errors.confirmPassword}
        />
        <HelperText type="error" visible={!!errors.confirmPassword}>
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
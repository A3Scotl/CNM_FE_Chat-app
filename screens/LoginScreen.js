import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { login } from '../apis/auth.api';
import ErrorDialog from '../components/ErrorDialog';

export default function LoginScreen({ navigation }) {
  const [form, setForm] = useState({
    phoneNumber: '0123456789',
    passWord: '123456',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ visible: false, message: '' });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (!form.phoneNumber.trim() || !form.passWord.trim()) {
      setError({ visible: true, message: 'Vui lòng nhập số điện thoại và mật khẩu' });
      return;
    }

    setLoading(true);
    try {
      const response = await login({
        phoneNumber: form.phoneNumber.trim(),
        passWord: form.passWord.trim(),
      });
      if(response?.isSuccess){
        navigation.navigate('Home', { user: response.data });
      }
      else{
        setError({
          visible: true,
          message: 'Số điện thoại hoặc mật khẩu không đúng !',
        });
      }
    } catch (err) {
      setError({
        visible: true,
        message: err.message || 'Đăng nhập thất bại. Vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng Nhập</Text>

      <TextInput
        label="Số điện thoại"
        value={form.phoneNumber}
        onChangeText={(text) => handleChange('phoneNumber', text)}
        keyboardType="phone-pad"
        style={styles.input}
        autoCapitalize="none"
        mode="outlined"
      />

      <TextInput
        label="Mật khẩu"
        value={form.passWord}
        onChangeText={(text) => handleChange('passWord', text)}
        
        secureTextEntry
        style={styles.input}
        autoCapitalize="none"
        mode="outlined"
      />

      <Text style={styles.forgotPasswordText} onPress={() => navigation.navigate('ForgotPassword')}>
        Quên mật khẩu?
      </Text>

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Đăng Nhập
      </Button>

      <Text
        style={styles.registerText}
        onPress={() => navigation.navigate('Register')}
      >
        Chưa có tài khoản? Đăng ký ngay
      </Text>

      <ErrorDialog
        visible={error.visible}
        message={error.message}
        onDismiss={() => setError((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  forgotPasswordText: {
    textAlign: 'right',
    color: '#1976D2',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 4,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
  },
  registerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#1976D2',
    fontSize: 16,
  },
});

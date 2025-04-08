import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, RadioButton } from 'react-native-paper';
import { register } from '../apis/auth.api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    email: '',
    passWord: '',
    gender: 'male',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
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
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Đăng ký</Text>

      <TextInput label="Họ và tên" mode="outlined" value={form.fullName} onChangeText={(text) => handleChange('fullName', text)} style={styles.input} />
      <TextInput label="Tên người dùng" mode="outlined" value={form.userName} onChangeText={(text) => handleChange('userName', text)} style={styles.input} />
      <TextInput label="Số điện thoại" mode="outlined" value={form.phoneNumber} onChangeText={(text) => handleChange('phoneNumber', text)} keyboardType="phone-pad" style={styles.input} />
      <TextInput label="Email" mode="outlined" value={form.email} onChangeText={(text) => handleChange('email', text)} keyboardType="email-address" style={styles.input} />
      <TextInput label="Mật khẩu" mode="outlined" value={form.passWord} onChangeText={(text) => handleChange('passWord', text)} secureTextEntry style={styles.input} />

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
        style={styles.button}
      >
        Đăng ký
      </Button>

      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Đã có tài khoản? Đăng nhập
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'white' },
  title: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  genderLabel: { marginTop: 10, fontSize: 16, marginBottom: 4 },
  radioRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  button: { marginTop: 8, borderRadius: 8 },
  link: { textAlign: 'center', marginTop: 20, color: '#007AFF', fontSize: 16 },
});

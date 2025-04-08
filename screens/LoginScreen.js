import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Mật khẩu" secureTextEntry style={styles.input} />
      <Button title="Đăng nhập" onPress={() => navigation.navigate('Home')} />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Chưa có tài khoản? Đăng ký
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  link: { marginTop: 10, color: 'blue', textAlign: 'center' },
});

import React from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';

export default function HomeScreen({ navigation, route }) {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng, {user.fullName}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>👤 Username: {user.userName}</Text>
        <Text style={styles.label}>📞 Số điện thoại: {user.phoneNumber}</Text>
        <Text style={styles.label}>📧 Email: {user.email}</Text>
        <Text style={styles.label}>🚻 Giới tính: {user.gender === 'male' ? 'Nam' : 'Nữ'}</Text>
        <Text style={styles.label}>🟢 Trạng thái: {user.status}</Text>
      </View>

      <Button title="Đăng xuất" onPress={() => navigation.replace('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  infoBox: {
    marginBottom: 20,
    width: '100%',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
  },
  label: { fontSize: 16, marginBottom: 8 },
});

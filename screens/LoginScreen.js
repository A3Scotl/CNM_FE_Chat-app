import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, Portal, Dialog, Paragraph } from 'react-native-paper';
import { login } from '../apis/auth.api';
import { handleApiError } from '../utils/handleApiError';

export default function LoginScreen({ navigation }) {

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Đăng nhập</Text>

      <TextInput
        label="Số điện thoại"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Mật khẩu"
        value={passWord}
        onChangeText={setPassWord}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      >
        Đăng nhập
      </Button>

      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Chưa có tài khoản? Đăng ký
      </Text>

      {/* Modal lỗi */}
      <Portal>
        <Dialog visible={errorVisible} onDismiss={() => setErrorVisible(false)}>
          <Dialog.Title>Lỗi</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{errorMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErrorVisible(false)}>Đóng</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'white' },
  title: { textAlign: 'center', marginBottom: 30 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, borderRadius: 8 },
  link: {
    textAlign: 'center',
    marginTop: 20,
    color: '#007AFF',
    fontSize: 16,
  },
});

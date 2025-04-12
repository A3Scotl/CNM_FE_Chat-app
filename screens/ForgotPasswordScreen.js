import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { requestOtpForgotPassword } from '../apis/auth.api';
import ErrorDialog from '../components/Error/ErrorDialog';

export default function ForgotPasswordScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ visible: false, message: '' });

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setDialog({ visible: true, message: 'Vui lòng nhập số điện thoại' });
      return;
    }

    try {
      setLoading(true);
      await requestOtpForgotPassword(phoneNumber.trim());

      navigation.navigate('OTPScreen', {
        phoneNumber,
        isForgotPassword: true
      });

    } catch (err) {
      setDialog({ visible: true, message: err.message || 'Gửi mã thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>

      <TextInput
        label="Số điện thoại"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        mode="outlined"
        keyboardType="phone-pad"
        style={{ marginTop: 10 }}
      />

      <Button
        mode="contained"
        style={styles.button}
        onPress={handleSendCode}
        loading={loading}
        disabled={loading}
      >
        Gửi mã xác minh
      </Button>

      <ErrorDialog
        visible={dialog.visible}
        message={dialog.message}
        onDismiss={() => setDialog({ ...dialog, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    display:'flex',
    justifyContent:'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 6
  }
});

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { verifyOtpSignup } from '../apis/auth.api';
import ErrorDialog from '../components/ErrorDialog';

const OTPScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { phoneNumber } = route.params;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setDialogMessage('Mã OTP phải đủ 6 chữ số');
      setDialogVisible(true);
      return;
    }

    try {
      setLoading(true);
      await verifyOtpSignup({ phoneNumber, otp });
      navigation.navigate('Login');
    } catch (error) {
      setDialogMessage(error.message || 'Xác thực OTP thất bại');
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhập mã OTP</Text>
      <Text style={styles.subtitle}>
        Mã xác thực đã gửi tới số điện thoại {phoneNumber}
      </Text>

      <TextInput
        label="Mã OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleVerifyOtp}
        loading={loading}
        style={styles.button}
        buttonColor={theme.colors.primary}
      >
        Xác nhận
      </Button>

      <ErrorDialog
        visible={dialogVisible}
        message={dialogMessage}
        onDismiss={() => setDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    fontSize: 18,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
    padding: 8,
  },
});

export default OTPScreen;

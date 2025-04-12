import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { verifyOtpSignup, verifyOtpForgotPassword, requestOtpForgotPassword } from '../apis/auth.api';
import ErrorDialog from '../components/ErrorDialog';

const OTPScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { phoneNumber, isSignup, isForgotPassword } = route.params;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ visible: false, message: '' });
  const [timer, setTimer] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setDialog({ visible: true, message: 'Mã OTP phải đủ 6 chữ số' });
      return;
    }

    try {
      setLoading(true);
      let result;

      if (isSignup) {
        result = await verifyOtpSignup({ phoneNumber, otp });
        navigation.navigate('Login');
      } else if (isForgotPassword) {
        result = await verifyOtpForgotPassword({ phoneNumber, otp });
        // result.data.user, result.data.access_token
        setDialog({
          visible: true,
          message: `Mật khẩu mới của bạn là: ${result.data.newPassword || 'đã gửi SMS'}`
        });
      }

    } catch (error) {
      setDialog({ visible: true, message: error.message || 'Xác thực OTP thất bại' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      if (isForgotPassword) {
        await requestOtpForgotPassword(phoneNumber);
      }
      setTimer(60);
      setDialog({ visible: true, message: 'OTP mới đã được gửi!' });
    } catch (error) {
      setDialog({ visible: true, message: error.message || 'Gửi lại OTP thất bại' });
    } finally {
      setResending(false);
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

      {timer > 0 ? (
        <Text style={styles.timerText}>Bạn có thể gửi lại mã sau {timer}s</Text>
      ) : (
        <Button
          onPress={handleResendOtp}
          loading={resending}
          style={styles.resendButton}
        >
          Gửi lại mã OTP
        </Button>
      )}

      <ErrorDialog
        visible={dialog.visible}
        message={dialog.message}
        onDismiss={() => setDialog({ ...dialog, visible: false })}
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
  timerText: {
    textAlign: 'center',
    marginTop: 16,
    color: 'gray',
  },
  resendButton: {
    marginTop: 16,
  },
});

export default OTPScreen;

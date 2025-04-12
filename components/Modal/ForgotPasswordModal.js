import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Modal, Card, TextInput, Button, useTheme, Text, IconButton } from 'react-native-paper';
import { requestOtpForgotPassword, verifyOtpForgotPassword } from '../../apis/auth.api';
import ErrorDialog from '../Error/ErrorDialog';

const ForgotPasswordModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request');
  const [error, setError] = useState({ visible: false, message: '' });

  const handleRequestOtp = async () => {
    if (!phoneNumber.trim()) {
      setError({ visible: true, message: "Vui lòng nhập số điện thoại" });
      return;
    }
    try {
      await requestOtpForgotPassword(phoneNumber.trim());
      setStep('verify');
    } catch (err) {
      setError({ visible: true, message: err.message || "Không thể gửi mã OTP." });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError({ visible: true, message: "Vui lòng nhập mã OTP" });
      return;
    }
    try {
      await verifyOtpForgotPassword({ phoneNumber: phoneNumber.trim(), otp: otp.trim() });
      setError({ visible: true, message: "Mật khẩu mới đã được gửi qua SMS." });
      handleClose();
    } catch (err) {
      setError({ visible: true, message: err.message || "Xác minh OTP thất bại." });
    }
  };

  const handleClose = () => {
    onClose();
    setPhoneNumber('');
    setOtp('');
    setStep('request');
  };


    return (
        <Modal visible={visible} onDismiss={handleClose} style={styles.modal}>
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                <Card.Title title="Quên Mật Khẩu" />
                <Card.Content>
                    <TextInput
                        label="Số điện thoại"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        style={styles.input}
                        disabled={step === 'verify'}
                    />
                    {step === 'verify' && (
                        <TextInput
                            label="Nhập mã OTP"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            style={styles.input}
                        />
                    )}
                </Card.Content>
                <Card.Actions>
                    {step === 'request' ? (
                        <Button mode="contained" onPress={handleRequestOtp} style={styles.button}>
                            Gửi mã OTP
                        </Button>
                    ) : (
                        <Button mode="contained" onPress={handleVerifyOtp} style={styles.button}>
                            Xác nhận OTP
                        </Button>
                    )}
                    <Button mode="outlined" onPress={handleClose} style={styles.button}>
                        Huỷ
                    </Button>
                </Card.Actions>
            </Card>
            <ErrorDialog
                    visible={error.visible}
                    message={error.message}
                    onDismiss={() => setError((prev) => ({ ...prev, visible: false }))}
                  />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: { justifyContent: 'center', borderRadius: 8 },
    card: { margin: 20, borderRadius: 8, padding: 8 },
    input: { marginVertical: 8 },
    button: { marginHorizontal: 8 }
});

export default ForgotPasswordModal;

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Modal, 
  Portal, 
  Card, 
  List, 
  Avatar, 
  Divider, 
  Button, 
  TextInput, 
  useTheme 
} from 'react-native-paper';
import { requestOtpForgotPassword, verifyOtpForgotPassword } from '../../apis/auth.api';

const SettingsModal = ({
  visible,
  user,
  onDismiss,
  onNotificationPress,
  onSecurityPress,
  onFastMessageToggle,
  onChangePasswordPress
}) => {
  const { colors } = useTheme();

  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'verify'

  const handleRequestOtp = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }
    try {
      await requestOtpForgotPassword(phoneNumber.trim());
      Alert.alert("Thành công", "Mã OTP đã được gửi về số điện thoại của bạn.");
      setStep('verify');  // chuyển sang bước nhập OTP
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể gửi mã OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP");
      return;
    }
    try {
      const result = await verifyOtpForgotPassword({ phoneNumber: phoneNumber.trim(), otp: otp.trim() });
      // Backend sẽ gửi mật khẩu mới qua SMS
      Alert.alert("Thành công", "Mật khẩu mới đã được gửi qua SMS.");
      setForgotPasswordVisible(false);
      setPhoneNumber('');
      setOtp('');
      setStep('request');
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Xác minh OTP thất bại.");
    }
  };

  const renderSettingItem = (title, icon, description, isActive, onPress) => (
    <List.Item
      title={title}
      description={description}
      left={() => <List.Icon icon={icon} color={isActive ? colors.primary : colors.textSecondary} />}
      right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
      onPress={onPress}
      titleStyle={{ color: colors.text }}
      descriptionStyle={{ color: colors.textSecondary }}
    />
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} style={styles.modal}>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Cài đặt"
            subtitle="Tùy chỉnh ứng dụng"
            left={(props) => <Avatar.Icon {...props} icon="cog" />}
            
          />
          <Card.Content>
            <List.Section>
              {renderSettingItem('Thông báo', 'bell', 'Tùy chỉnh thông báo', false, onNotificationPress)}
              <Divider />
              {renderSettingItem('Bảo mật', 'shield-lock', 'Cài đặt bảo mật', false, onSecurityPress)}
              <Divider />
              {renderSettingItem('Tin nhắn nhanh', 'lightning-bolt', user?.enable_fast_message ? 'Đã bật' : 'Đã tắt', user?.enable_fast_message, onFastMessageToggle)}
              <Divider />
              {renderSettingItem('Đổi mật khẩu', 'lock-reset', 'Cập nhật mật khẩu', false, onChangePasswordPress)}
              <Divider />
              {renderSettingItem('Quên mật khẩu', 'help-circle', 'Khôi phục mật khẩu', false, () => setForgotPasswordVisible(true))}
            </List.Section>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={onDismiss} style={styles.button} labelStyle={styles.buttonLabel}>
              Đóng
            </Button>
          </Card.Actions>
        </Card>
      </Modal>

      {/* Modal Quên Mật Khẩu */}
      <Modal visible={forgotPasswordVisible} onDismiss={() => setForgotPasswordVisible(false)} style={styles.modal}>
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
            <Button mode="outlined" onPress={() => setForgotPasswordVisible(false)} style={styles.button}>
              Huỷ
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    borderRadius: 8,
  },
  card: {
    margin: 20,
    borderRadius: 8,
    padding: 8,
  },
  button: {
    marginHorizontal: 8,
  },
  input: {
    marginVertical: 8,
  },
  buttonLabel: {
    color: 'white',
  },
});

export default SettingsModal;

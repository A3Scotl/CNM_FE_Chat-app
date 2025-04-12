import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  List,
  Avatar,
  Divider,
  Button,
  useTheme
} from 'react-native-paper';
import ChangePasswordModal from './ChangePasswordModal';
import ForgotPasswordModal from './ForgotPasswordModal';

const SettingsModal = ({
  visible,
  user,
  onDismiss,
  onNotificationPress,
  onSecurityPress,
  onFastMessageToggle
}) => {
  const { colors } = useTheme();

  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const renderSettingItem = (title, icon, description, isActive, onPress) => (
    <List.Item
      title={title}
      description={description}
      left={() => (
        <List.Icon
          icon={icon}
          color={isActive ? colors.primary : colors.textSecondary}
        />
      )}
      right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
      onPress={onPress}
      titleStyle={{ color: colors.text }}
      descriptionStyle={{ color: colors.textSecondary }}
    />
  );

  return (
    <Portal>
      {/* Modal Cài đặt */}
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
              {renderSettingItem(
                'Tin nhắn nhanh',
                'lightning-bolt',
                user?.enable_fast_message ? 'Đã bật' : 'Đã tắt',
                user?.enable_fast_message,
                onFastMessageToggle
              )}
              <Divider />
              {renderSettingItem(
                'Đổi mật khẩu',
                'lock-reset',
                'Cập nhật mật khẩu',
                false,
                () => setChangePasswordVisible(true)
              )}
              <Divider />
              {renderSettingItem(
                'Quên mật khẩu',
                'help-circle',
                'Khôi phục mật khẩu',
                false,
                () => setForgotPasswordVisible(true)
              )}
            </List.Section>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={onDismiss} style={styles.button} labelStyle={styles.buttonLabel}>
              Đóng
            </Button>
          </Card.Actions>
        </Card>
      </Modal>

      {/* Modal Đổi mật khẩu */}
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />

      {/* Modal Quên mật khẩu */}
      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
      />
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
  buttonLabel: {
    color: 'white',
  },
});

export default SettingsModal;

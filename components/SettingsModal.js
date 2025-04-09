import React from 'react';
import { View, StyleSheet } from 'react-native';
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

  const renderSettingItem = (title, icon, description, isActive, onPress) => {
    return (
      <List.Item
        title={title}
        description={description}
        left={() => (
          <List.Icon 
            icon={icon} 
            color={isActive ? colors.primary : colors.textSecondary} 
          />
        )}
        right={() => (
          <List.Icon 
            icon="chevron-right" 
            color={colors.textSecondary} 
          />
        )}
        onPress={onPress}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.textSecondary }}
      />
    );
  };

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss}
        style={styles.modal}
      >
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Cài đặt"
            subtitle="Tùy chỉnh ứng dụng"
            left={(props) => <Avatar.Icon {...props} icon="cog" />}
            right={(props) => (
              <Avatar.Icon 
                {...props} 
                icon="close" 
                size={30} 
                onPress={onDismiss} 
              />
            )}
          />
          
          <Card.Content>
            <List.Section>
              {renderSettingItem(
                'Thông báo', 
                'bell', 
                'Tùy chỉnh thông báo',
                false,
                onNotificationPress
              )}
              <Divider />
              
              {renderSettingItem(
                'Bảo mật', 
                'shield-lock', 
                'Cài đặt bảo mật',
                false,
                onSecurityPress
              )}
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
                onChangePasswordPress
              )}
            </List.Section>
          </Card.Content>
          
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={onDismiss}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Đóng
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
  },
  card: {
    margin: 20,
    borderRadius: 8,
    padding: 8,
  },
  button: {
    marginHorizontal: 8,
    marginBottom: 8,
    flex: 1,
  },
  buttonLabel: {
    color: 'white',
  },
});

export default SettingsModal;
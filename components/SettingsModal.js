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
const SettingsModal = ({ visible, user, onDismiss }) => {
  const { colors } = useTheme();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <Card style={[styles.card, { backgroundColor: colors.white }]}>
          <Card.Title
            title="Cài đặt"
            subtitle="Tùy chỉnh ứng dụng"
            left={(props) => <Avatar.Icon {...props} icon="cog" />}
            right={(props) => (
              <Avatar.Icon 
                {...props} 
                icon="close" 
                size={40} 
                onPress={onDismiss} 
              />
            )}
          />
          <Card.Content>
            <List.Section>
              {renderSettingItem('Thông báo', 'bell', 'Tùy chỉnh thông báo')}
              <Divider />
              {renderSettingItem('Bảo mật', 'shield-lock', 'Cài đặt bảo mật')}
              <Divider />
              {renderSettingItem(
                'Tin nhắn nhanh', 
                'lightning-bolt', 
                user?.enable_fast_message ? 'Đã bật' : 'Đã tắt',
                user?.enable_fast_message
              )}
              <Divider />
              {renderSettingItem('Đổi mật khẩu', 'lock-reset', 'Cập nhật mật khẩu')}
            </List.Section>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={onDismiss}
              style={styles.button}
              labelStyle={{ color: colors.white }}
            >
              Đóng
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const renderSettingItem = (title, icon, description, isActive) => {
  const { colors } = useTheme();
  
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
      onPress={() => {}}
      titleStyle={{ color: colors.text }}
      descriptionStyle={{ color: colors.textSecondary }}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 8,
  },
  button: {
    marginHorizontal: 8,
    flex: 1,
  },
});

export default SettingsModal;
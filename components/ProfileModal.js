import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Card, Avatar, Text, Divider, Chip, Button, useTheme } from 'react-native-paper';

const ProfileModal = ({ visible, user, onDismiss }) => {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    card: {
      margin: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      padding: 20,
      paddingBottom: 30,
    },
    avatar: {
      borderWidth: 3,
      borderColor: 'white',
      marginBottom: 10,
    },
    name: {
      fontSize: 20,
      fontWeight:'bold'
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    label: {
      fontSize: 15,
    },
    value: {
      fontSize: 15,
      fontWeight: '500',
    },
    divider: {
      marginVertical: 4,
    },
    footer: {
      justifyContent: 'center',
      padding: 16,
    },
    button: {
      flex: 1,
      borderRadius: 6,
    },
  });
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <Card style={[styles.card, { backgroundColor: 'white' }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Avatar.Image 
              size={80} 
              source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }} 
              style={styles.avatar}
            />
            <Text style={[styles.name, { color: colors.white }]}>{user?.fullName}</Text>
          </View>

          {/* Thông tin cá nhân */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Thông tin cá nhân</Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Số điện thoại:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.phoneNumber}</Text>
            </View>
            
            <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email || 'Chưa cập nhật'}</Text>
            </View>
            
            <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Giới tính:</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : 'Khác'}
              </Text>
            </View>
          </View>

          {/* Bảo mật */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Bảo mật</Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Xác thực 2 lớp:</Text>
              <Chip 
                style={{ backgroundColor: user?.is_twofa_enabled ? colors.success : colors.error ,  }}
                textStyle={{ color: 'white' }}
              >
                {user?.is_twofa_enabled ? 'Đã bật' : 'Đã tắt'}
              </Chip>
            </View>
          </View>

          {/* Footer */}
          <Card.Actions style={styles.footer}>
            <Button 
              mode="contained" 
              onPress={onDismiss}
              style={[styles.button, { backgroundColor: colors.primary }]}
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



export default ProfileModal;
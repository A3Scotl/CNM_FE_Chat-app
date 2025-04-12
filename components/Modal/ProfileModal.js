import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import {
  Modal, Portal, Card, Avatar, Text, Button,
  useTheme, ActivityIndicator, List
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar,getMyProfile } from '../../apis/user.api';

const ProfileModal = ({
  visible,
  user,
  token,
  onDismiss,
  onUpdateSuccess
}) => {
  const { colors } = useTheme();
  const [tempAvatar, setTempAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'App cần quyền truy cập ảnh');
      }
    })();
  }, []);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setTempAvatar(result.assets[0].uri);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Lỗi chọn ảnh:', error);
      Alert.alert('Error', 'Có lỗi khi chọn ảnh');
    }
  };

  const handleAvatarUpdate = async () => {
    if (!tempAvatar || !user?._id) return;
    
    setIsLoading(true);
    try {
      const updatedUser = await uploadAvatar(tempAvatar, user._id);
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
      onUpdateSuccess(updatedUser); 
      onDismiss();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Card style={styles.card}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator animating size="large" color={colors.primary} />
            </View>
          )}

          <ScrollView>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleImagePick}>
                <Avatar.Image
                  size={100}
                  source={{ uri: tempAvatar || user?.avatar || 'https://i.pravatar.cc/150' }}
                  style={styles.avatar}
                />
                <Avatar.Icon icon="camera" size={28} style={styles.cameraIcon} />
              </TouchableOpacity>
              <Text style={styles.nameText}>{user?.fullName || user?.userName}</Text>
            </View>

            <List.Section style={{'paddingHorizontal':20}}>
              <List.Item
                title="Tên tài khoản"
                description={user?.userName || 'Chưa cập nhật'}
                left={() => <List.Icon icon="account" />}
              />
              <List.Item
                title="Số điện thoại"
                description={user?.phoneNumber || 'Chưa cập nhật'}
                left={() => <List.Icon icon="phone" />}
              />
              <List.Item
                title="Email"
                description={user?.email || 'Chưa cập nhật'}
                left={() => <List.Icon icon="email" />}
              />
              <List.Item
                title="Ngày sinh"
                description={user?.dob || 'Chưa cập nhật'}
                left={() => <List.Icon icon="calendar" />}
              />
              <List.Item
                title="Giới tính"
                description={user?.gender || 'Chưa cập nhật'}
                left={() => <List.Icon icon="gender-male-female" />}
              />
            </List.Section>
          </ScrollView>

          <Card.Actions style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} disabled={isLoading}>Đóng</Button>
            <Button
              mode="contained"
              onPress={handleAvatarUpdate}
              disabled={!isEditing || isLoading}
              loading={isLoading}
              style={styles.saveButton}
            >
              Lưu ảnh
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const createStyles = (colors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.primary,
  },
  avatar: {
    borderWidth: 3,
    borderColor: 'white',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  nameText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    color:'white'
  },
});

export default ProfileModal;

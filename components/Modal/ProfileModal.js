import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import {
  Modal, Portal, Card, Avatar, Text, Button,
  useTheme, ActivityIndicator, List, TextInput, IconButton, Menu
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar, getMyProfile, updateProfile } from '../../apis/user.api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const ProfileModal = ({
  visible,
  user,
  onDismiss,
  onUpdateSuccess
}) => {
  const { colors } = useTheme();
  const [tempAvatar, setTempAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    email: '',
    dob: new Date(),
    gender: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderMenu, setShowGenderMenu] = useState(false);

  // Initialize original data for comparison
  const originalData = useMemo(() => ({
    fullName: user?.fullName || '',
    userName: user?.userName || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    dob: user?.dob ? new Date(user.dob).toISOString() : new Date().toISOString(),
    gender: user?.gender || ''
  }), [user]);

  // Sync editFormData with user prop
  useEffect(() => {
    if (user && visible) {
      const newFormData = {
        fullName: user.fullName || '',
        userName: user.userName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        dob: user.dob ? new Date(user.dob) : new Date(),
        gender: user.gender || ''
      };
      setEditFormData(newFormData);
      setTempAvatar(null);
      console.log('Synced editFormData:', newFormData);
    }
  }, [user, visible]);

  // Request image picker permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'App cần quyền truy cập ảnh');
      }
    })();
  }, []);

  // Check if there are changes in editFormData or tempAvatar
  const hasChanges = useMemo(() => {
    const currentDob = editFormData?.dob ? new Date(editFormData.dob).toISOString() : '';
    const originalDob = originalData?.dob || '';
    const changes = (
      (editFormData?.fullName || '') !== (originalData?.fullName || '') ||
      (editFormData?.userName || '') !== (originalData?.userName || '') ||
      (editFormData?.phoneNumber || '') !== (originalData?.phoneNumber || '') ||
      (editFormData?.email || '') !== (originalData?.email || '') ||
      currentDob !== originalDob ||
      (editFormData?.gender || '') !== (originalData?.gender || '') ||
      tempAvatar !== null
    );
    console.log('hasChanges:', changes, {
      fullName: { current: editFormData?.fullName, original: originalData?.fullName },
      userName: { current: editFormData?.userName, original: originalData?.userName },
      dob: { current: currentDob, original: originalDob },
      gender: { current: editFormData?.gender, original: originalData?.gender },
      tempAvatar
    });
    return changes;
  }, [editFormData, originalData, tempAvatar]);

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
      await uploadAvatar(tempAvatar, user._id);
      const updatedUser = await getMyProfile();
      console.log('Avatar updated, new user data:', updatedUser);
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
      onUpdateSuccess(updatedUser);
      setTempAvatar(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Lỗi cập nhật avatar:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user?._id || !hasChanges) {
      console.log('handleProfileUpdate skipped: No changes or invalid user ID');
      return;
    }

    setIsLoading(true);
    try {
      const formattedData = {
        fullName: editFormData.fullName,
        userName: editFormData.userName,
        dob: editFormData.dob.toISOString(),
        gender: editFormData.gender
      };
      console.log('Sending updateProfile payload:', formattedData);

      await updateProfile(formattedData);
      const updatedUser = await getMyProfile();
      console.log('Profile updated, fetched user data:', updatedUser);

      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
      onUpdateSuccess(updatedUser);
      setIsEditingProfile(false);

      setEditFormData({
        fullName: updatedUser.fullName || '',
        userName: updatedUser.userName || '',
        phoneNumber: updatedUser.phoneNumber || '',
        email: updatedUser.email || '',
        dob: updatedUser.dob ? new Date(updatedUser.dob) : new Date(),
        gender: updatedUser.gender || ''
      });
      setTempAvatar(null);
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditingProfile(!isEditingProfile);
    if (isEditingProfile) {
      setEditFormData({
        fullName: user?.fullName || '',
        userName: user?.userName || '',
        phoneNumber: user?.phoneNumber || '',
        email: user?.email || '',
        dob: user?.dob ? new Date(user.dob) : new Date(),
        gender: user?.gender || ''
      });
      setTempAvatar(null);
      setIsEditing(false);
      console.log('Exited edit mode, reset editFormData');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditFormData({ ...editFormData, dob: selectedDate });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
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
          <View style={styles.cardContent}>
            <ScrollView>
              {isEditingProfile ? (
                <>
                  <View style={styles.editHeader}>
                    <TouchableOpacity onPress={handleImagePick}>
                      <Avatar.Image
                        size={100}
                        source={{ uri: tempAvatar || user?.avatar || 'https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg' }}
                        style={styles.avatar}
                      />
                      <Avatar.Icon icon="camera" size={28} style={styles.cameraIcon} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formContainer}>
                    <TextInput
                      label="Họ và tên"
                      value={editFormData.fullName}
                      onChangeText={text => setEditFormData({ ...editFormData, fullName: text })}
                      style={styles.input}
                      mode="outlined"
                    />
                    <TextInput
                      label="Tên tài khoản"
                      value={editFormData.userName}
                      onChangeText={text => setEditFormData({ ...editFormData, userName: text })}
                      style={styles.input}
                      mode="outlined"
                    />
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                      <TextInput
                        label="Ngày sinh"
                        value={formatDate(editFormData.dob)}
                        style={styles.input}
                        mode="outlined"
                        editable={false}
                        right={<TextInput.Icon icon="calendar" />}
                      />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={editFormData.dob}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                    <Menu
                      visible={showGenderMenu}
                      onDismiss={() => setShowGenderMenu(false)}
                      anchor={
                        <TouchableOpacity onPress={() => setShowGenderMenu(true)}>
                          <TextInput
                            label="Giới tính"
                            value={editFormData.gender}
                            style={styles.input}
                            mode="outlined"
                            editable={false}
                            right={<TextInput.Icon icon="chevron-down" />}
                          />
                        </TouchableOpacity>
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          setEditFormData({ ...editFormData, gender: 'male' });
                          setShowGenderMenu(false);
                        }}
                        title="Nam"
                      />
                      <Menu.Item
                        onPress={() => {
                          setEditFormData({ ...editFormData, gender: 'female' });
                          setShowGenderMenu(false);
                        }}
                        title="Nữ"
                      />
                      <Menu.Item
                        onPress={() => {
                          setEditFormData({ ...editFormData, gender: 'other' });
                          setShowGenderMenu(false);
                        }}
                        title="Khác"
                      />
                    </Menu>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.header}>
                    <TouchableOpacity onPress={handleImagePick}>
                      <Avatar.Image
                        size={100}
                        source={{ uri: tempAvatar || user?.avatar || 'https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg' }}
                        style={styles.avatar}
                      />
                      <Avatar.Icon icon="camera" size={28} style={styles.cameraIcon} />
                    </TouchableOpacity>
                    <Text style={styles.nameText}>{user?.fullName || user?.userName}</Text>
                    <IconButton
                      icon="pencil"
                      size={20}
                      style={styles.editButton}
                      onPress={toggleEditMode}
                    />
                  </View>

                  <List.Section style={{ paddingHorizontal: 20 }}>
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
                      description={formatDate(user?.dob)}
                      left={() => <List.Icon icon="calendar" />}
                    />
                    <List.Item
                      title="Giới tính"
                      description={user?.gender || 'Chưa cập nhật'}
                      left={() => <List.Icon icon="gender-male-female" />}
                    />
                  </List.Section>
                </>
              )}
            </ScrollView>

            <Card.Actions style={styles.actions}>
              {isEditingProfile ? (
                <>
                  <Button mode="outlined" onPress={toggleEditMode} disabled={isLoading}>
                    Hủy
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleProfileUpdate}
                    disabled={isLoading || !hasChanges}
                    loading={isLoading}
                    style={styles.saveButton}
                  >
                    Lưu thông tin
                  </Button>
                </>
              ) : (
                <>
                  <Button mode="outlined" onPress={onDismiss} disabled={isLoading}>
                    Đóng
                  </Button>
                  {isEditing && (
                    <Button
                      mode="contained"
                      onPress={handleAvatarUpdate}
                      disabled={!isEditing || isLoading}
                      loading={isLoading}
                      style={styles.saveButton}
                    >
                      Lưu ảnh
                    </Button>
                  )}
                </>
              )}
            </Card.Actions>
          </View>
        </Card>
      </Modal>
    </Portal>
  );
};

const createStyles = (colors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    height: 600
  },
  card: {
    margin: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    maxHeight: '100%',
  },
  cardContent: {
    overflow: 'hidden', // Moved overflow: hidden here
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
    position: 'relative',
  },
  editHeader: {
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
  },
  saveButton: {
    backgroundColor: colors.primary,
    color: 'white'
  },
  editButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  datePickerButton: {
    width: '100%',
  },
});

export default ProfileModal;
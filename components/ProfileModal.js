import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Modal, Portal, Card, Avatar, Text, Divider, Chip, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { userApi } from '../apis/user.api';
import Cookies from 'universal-cookie';

const ProfileModal = ({ visible, user,token, onDismiss, onUpdateSuccess, navigation }) => {
    const { colors } = useTheme();
    const [tempAvatar, setTempAvatar] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [authToken, setAuthToken] = useState(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setTempAvatar(result.assets[0].uri);
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!authToken) {
            Alert.alert(
                'Lỗi xác thực',
                'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
                [
                    { 
                        text: 'Đăng nhập', 
                        onPress: () => {
                            onDismiss();
                            navigation.navigate('Login');
                        }
                    }
                ]
            );
            return;
        }

        if (!tempAvatar) return;

        setIsLoading(true);
        try {
            const updatedUser = await userApi.uploadAvatar(tempAvatar, authToken);
            Alert.alert('Thành công', 'Cập nhật avatar thành công');
            onUpdateSuccess(updatedUser);
            onDismiss();
        } catch (error) {
            console.error('API Error:', error);
            
            if (error.response?.status === 401) {
                // Token hết hạn
                cookies.remove('jwt');
                navigation.navigate('Login');
            } else {
                Alert.alert('Lỗi', error.message || 'Cập nhật thất bại');
            }
        } finally {
            setIsLoading(false);
        }
    };

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
            backgroundColor: colors.primary,
        },
        avatarContainer: {
            position: 'relative',
            marginBottom: 10,
        },
        avatar: {
            borderWidth: 3,
            borderColor: 'white',
        },
        editIcon: {
            position: 'absolute',
            right: 0,
            bottom: 0,
            backgroundColor: colors.accent,
            borderRadius: 15,
            padding: 5,
        },
        name: {
            fontSize: 20,
            fontWeight: 'bold',
            color: 'white',
        },
        section: {
            padding: 16,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 12,
            color: colors.primary,
        },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 8,
        },
        label: {
            fontSize: 15,
            color: colors.textSecondary,
        },
        value: {
            fontSize: 15,
            fontWeight: '500',
            color: colors.text,
        },
        divider: {
            marginVertical: 4,
            backgroundColor: colors.border,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 16,
        },
        button: {
            flex: 1,
            borderRadius: 6,
            marginHorizontal: 8,
        },
        loadingContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1000,
        },
    });

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss}>
                <Card style={[styles.card, { backgroundColor: 'white' }]}>
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator animating={true} size="large" color={colors.primary} />
                        </View>
                    )}

                    {/* Header with Avatar */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={pickImage}>
                                <Avatar.Image
                                    size={80}
                                    source={{ uri: tempAvatar || user?.avatar || 'https://i.pravatar.cc/150' }}
                                    style={styles.avatar}
                                />
                                <Avatar.Icon
                                    icon="pencil"
                                    size={24}
                                    style={styles.editIcon}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.name}>{user?.fullName}</Text>
                    </View>

                    {/* Personal Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Số điện thoại:</Text>
                            <Text style={styles.value}>{user?.phoneNumber}</Text>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{user?.email || 'Chưa cập nhật'}</Text>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Giới tính:</Text>
                            <Text style={styles.value}>
                                {user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : 'Khác'}
                            </Text>
                        </View>
                    </View>

                    {/* Security Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bảo mật</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Xác thực 2 lớp:</Text>
                            <Chip
                                style={{ backgroundColor: user?.is_twofa_enabled ? colors.success : colors.error }}
                                textStyle={{ color: 'white' }}
                            >
                                {user?.is_twofa_enabled ? 'Đã bật' : 'Đã tắt'}
                            </Chip>
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <Card.Actions style={styles.footer}>
                        <Button
                            mode="outlined"
                            onPress={onDismiss}
                            style={styles.button}
                        >
                            Hủy
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            labelStyle={{ color: 'white' }}
                            disabled={!isEditing || !authToken}
                        >
                            Lưu thay đổi
                        </Button>
                    </Card.Actions>
                </Card>
            </Modal>
        </Portal>
    );
};

export default ProfileModal;
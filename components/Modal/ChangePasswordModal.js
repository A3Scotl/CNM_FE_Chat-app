import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Modal, Card, TextInput, Button, useTheme } from 'react-native-paper';
import { changePassword } from '../../apis/auth.api';
import ErrorDialog from '../Error/ErrorDialog';
const ChangePasswordModal = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const [error, setError] = useState({ visible: false, message: '' });

    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = form;

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError({ visible: true, message: "Vui lòng nhập đầy đủ thông tin" });
            return;
        }
        if (newPassword !== confirmPassword) {
            setError({ visible: true, message: "Mật khẩu mới và xác nhận không khớp" });
            return;
        }
        if (newPassword.length < 7) {
            setError({ visible: true, message: "Mật khẩu mới có ít nhất 6 kí tự" });
            return;
        }

        try {
            const result = await changePassword({ oldPassword, newPassword, confirmPassword });
            if (result?.message) {
                Alert.alert("Thành công", result.message);
                onClose();
                setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setError({ visible: true, message: "Đổi mật khẩu không thành công" });
        }
    };

    return (
        <Modal visible={visible} onDismiss={onClose} style={styles.modal}>
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                <Card.Title title="Đổi Mật Khẩu" />
                <Card.Content>
                    <TextInput label="Mật khẩu cũ" value={form.oldPassword} onChangeText={text => handleChange('oldPassword', text)} secureTextEntry style={styles.input} />
                    <TextInput label="Mật khẩu mới" value={form.newPassword} onChangeText={text => handleChange('newPassword', text)} secureTextEntry style={styles.input} />
                    <TextInput label="Xác nhận mật khẩu mới" value={form.confirmPassword} onChangeText={text => handleChange('confirmPassword', text)} secureTextEntry style={styles.input} />
                </Card.Content>
                <Card.Actions>
                    <Button mode="contained" onPress={handleChangePassword} style={styles.button}>Đổi mật khẩu</Button>
                    <Button mode="outlined" onPress={onClose} style={styles.button}>Huỷ</Button>
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

export default ChangePasswordModal;

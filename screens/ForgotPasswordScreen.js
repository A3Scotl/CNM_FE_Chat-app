import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, RadioButton, TextInput } from 'react-native-paper';

export default function ForgotPasswordScreen({ navigation }) {
  const [method, setMethod] = useState('email');
  const [value, setValue] = useState('');

  const handleSendCode = () => {
    // Gửi mã xác minh về email hoặc số điện thoại tương ứng
    if (!value.trim()) return;
    // TODO: Gửi mã qua API tương ứng với method
    console.log(`Gửi mã qua ${method}: ${value}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>

      <RadioButton.Group onValueChange={setMethod} value={method}>
        <RadioButton.Item label="Gửi mã qua Email" value="email" />
        <RadioButton.Item label="Gửi mã qua Số điện thoại" value="phone" />
      </RadioButton.Group>

      <TextInput
        label={method === 'email' ? 'Email' : 'Số điện thoại'}
        value={value}
        onChangeText={setValue}
        mode="outlined"
        keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
        style={{ marginTop: 10 }}
      />

      <Button mode="contained" style={styles.button} onPress={handleSendCode}>
        Gửi mã xác minh
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 6
  }
});

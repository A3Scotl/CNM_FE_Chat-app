import React from 'react';
import { View, Text } from 'react-native';
import { RadioButton } from 'react-native-paper';

export default function GenderRadioGroup({ value, onValueChange }) {
  return (
    <>
      <Text style={{ marginTop: 10, fontSize: 16, marginBottom: 4 }}>Giới tính</Text>
      <RadioButton.Group onValueChange={onValueChange} value={value}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <RadioButton.Item label="Nam" value="male" />
          <RadioButton.Item label="Nữ" value="female" />
        </View>
      </RadioButton.Group>
    </>
  );
}

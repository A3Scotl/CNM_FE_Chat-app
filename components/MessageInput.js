import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton, useTheme } from 'react-native-paper';

const MessageInput = ({ value, onChangeText, onSend }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.white }]}
        placeholder="Nhập tin nhắn..."
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        multiline
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        left={<TextInput.Icon icon="emoticon-happy-outline" color={colors.primary} />}
        right={
          <TextInput.Icon 
            icon="send" 
            color={value.trim() ? colors.primary : colors.textSecondary}
            onPress={() => value.trim() && onSend()} 
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
  },
});

export default MessageInput;
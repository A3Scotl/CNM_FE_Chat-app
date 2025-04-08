import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Avatar, Text, useTheme, TextInput, IconButton } from 'react-native-paper';

const ChatArea = ({ chat, onBack, user }) => {
  const { colors } = useTheme(); // Lấy colors từ theme
  const [message, setMessage] = useState('');

  // Tạo stylesheet bên trong component để có thể sử dụng colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    avatar: {
      marginRight: 10,
    },
    chatContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
    },
    welcomeText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    inputContainer: {
      padding: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.white,
    },
    input: {
      flex: 1,
      backgroundColor: colors.white,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header chat */}
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.BackAction onPress={onBack} color={colors.white} />
        <Avatar.Image 
          size={40} 
          source={{ uri: chat.avatar }} 
          style={styles.avatar}
        />
        <Appbar.Content 
          title={chat.name} 
          titleStyle={{ color: colors.white }} 
        />
      </Appbar.Header>

      {/* Nội dung chat */}
      <View style={styles.chatContent}>
        <Text style={styles.welcomeText}>Bắt đầu trò chuyện với {chat.name}</Text>
      </View>

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          mode="outlined"
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="emoticon-happy-outline" color={colors.primary} />}
          right={
            <TextInput.Icon 
              icon="send" 
              color={message ? colors.primary : colors.textSecondary}
              onPress={() => message.trim() && setMessage('')} 
            />
          }
        />
      </View>
    </View>
  );
};

export default ChatArea;
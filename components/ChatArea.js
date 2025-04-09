import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Avatar, Text, useTheme, TextInput } from 'react-native-paper';

const ChatArea = ({ chat, onBack, user }) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    avatar: {
      marginRight: 10,
    },
    chatContent: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    messageBubble: {
      padding: 10,
      borderRadius: 10,
      marginBottom: 8,
      maxWidth: '80%',
    },
    messageMe: {
      alignSelf: 'flex-end',
      backgroundColor: '#DCF8C6',
    },
    messageOther: {
      alignSelf: 'flex-start',
      backgroundColor: '#E1E1E1',
    },
    timestamp: {
      fontSize: 10,
      textAlign: 'right',
      color: '#888',
      marginTop: 4,
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

  const mockMessages = [
    {
      id: '1',
      senderId: 'me',
      content: 'Chào bạn!',
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      senderId: 'Alice',
      content: 'Hi, mình là Alice.',
      timestamp: '10:01 AM',
    },
    {
      id: '3',
      senderId: 'me',
      content: 'Bạn khỏe không?',
      timestamp: '10:02 AM',
    },
    {
      id: '4',
      senderId: 'Alice',
      content: 'Mình ổn, cảm ơn! Còn bạn?',
      timestamp: '10:03 AM',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header chat */}
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.BackAction onPress={onBack} color={colors.white} />
        <Avatar.Image size={40} source={{ uri: chat.avatar }} style={styles.avatar} />
        <Appbar.Content title={chat.name} titleStyle={{ color: colors.white }} />
      </Appbar.Header>

      {/* Nội dung chat */}
      <ScrollView style={styles.chatContent}>
        {mockMessages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.senderId === 'me' ? styles.messageMe : styles.messageOther,
            ]}
          >
            <Text>{msg.content}</Text>
            <Text style={styles.timestamp}>{msg.timestamp}</Text>
          </View>
        ))}
      </ScrollView>

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

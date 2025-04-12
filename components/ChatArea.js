import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { Appbar, Avatar, Text, useTheme, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const ChatArea = ({ chat, onBack, user }) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      paddingTop:40,
      paddingBottom:20
    },
    header: {
      backgroundColor: 'white',
      elevation: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerContent: {
      marginLeft: 12,
    },
    chatName: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    chatContent: {
      flex: 1,
      padding: 16,
    },
    messageBubble: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      maxWidth: '80%',
    },
    messageMe: {
      alignSelf: 'flex-end',
      backgroundColor: '#0098f9',
      borderTopRightRadius: 0,
    },
    messageOther: {
      alignSelf: 'flex-start',
      backgroundColor: 'white',
      borderTopLeftRadius: 0,
      elevation: 1,
    },
    messageTextMe: {
      color: 'white',
    },
    messageTextOther: {
      color: 'black',
    },
    timestamp: {
      fontSize: 11,
      color: '#888',
      marginTop: 4,
      textAlign: 'right',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    input: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      borderRadius: 20,
      paddingHorizontal: 16,
      marginHorizontal: 8,
      maxHeight: 100,
    },
    sendButton: {
      backgroundColor: '#0098f9',
      borderRadius: 20,
      padding: 8,
    },
    statusText: {
      fontSize: 12,
      color: '#666',
    },
  });

  const mockMessages = [
    {
      id: '1',
      senderId: 'other',
      content: 'Hi, mình là Alice.',
      timestamp: '10:01 AM',
    },
    {
      id: '2',
      senderId: 'other',
      content: 'Mình ổn, cảm ơn! Còn bạn?',
      timestamp: '10:03 AM',
    },
    {
      id: '3',
      senderId: 'me',
      content: 'Chào bạn!',
      timestamp: '10:00 AM',
    },
    {
      id: '4',
      senderId: 'me',
      content: 'Bạn khỏe không?',
      timestamp: '10:02 AM',
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Xử lý gửi tin nhắn ở đây
      setMessage('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header chat đơn giản */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="#0098f9" />
        </TouchableOpacity>
        <View style={{display:'flex',flexDirection:'row'}}>
          <Avatar.Image
            size={40}
            source={{ uri: chat.avatar || 'https://i.pravatar.cc/150' }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>

      {/* Nội dung chat */}
      <ScrollView
        style={styles.chatContent}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {mockMessages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.senderId === 'me' ? styles.messageMe : styles.messageOther,
            ]}
          >
            <Text style={msg.senderId === 'me' ? styles.messageTextMe : styles.messageTextOther}>
              {msg.content}
            </Text>
            <Text style={styles.timestamp}>{msg.timestamp}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputContainer}>
        <TouchableOpacity>
          <MaterialIcons name="insert-emoticon" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          multiline
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialIcons
            name="send"
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatArea;
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ChatArea = ({ route }) => {
  const { chat, user } = route.params;
  const messages = chat?.messages || []; // hoặc bạn có thể đổi cách lấy nếu cấu trúc khác

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {messages.map((msg, index) => (
          <View
            key={msg._id || msg.id || index}
            style={[
              styles.messageBubble,
              msg.senderId === 'me' ? styles.messageMe : styles.messageOther,
            ]}
          >
            <Text
              style={
                msg.senderId === 'me'
                  ? styles.messageTextMe
                  : styles.messageTextOther
              }
            >
              {msg.content}
            </Text>
            <Text style={styles.timestamp}>{msg.timestamp}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  scrollViewContent: {
    paddingBottom: 20,
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
});

export default ChatArea;

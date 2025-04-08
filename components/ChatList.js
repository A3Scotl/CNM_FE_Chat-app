import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import ChatListItem from './ChatListItem';

const ChatList = ({ chats, onChatSelect }) => {
  return (
    <View style={styles.container}>
      <List.Section>
        {chats.map(chat => (
          <ChatListItem 
            key={chat.id}
            chat={chat}
            onPress={() => onChatSelect(chat)}
          />
        ))}
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatList;
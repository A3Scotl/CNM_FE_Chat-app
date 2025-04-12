import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List } from 'react-native-paper';
import ChatListItem from './ChatListItem';

const ChatList = ({ chats, onChatSelect }) => {
  return (
    <View style={styles.container}>
      <ScrollView>
        <List.Section>
          {chats.map(chat => (
            <ChatListItem 
              key={chat.id}
              chat={chat}
              onPress={() => onChatSelect(chat)}
            />
          ))}
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    flex:1,
    minHeight:590
  },
});

export default ChatList;
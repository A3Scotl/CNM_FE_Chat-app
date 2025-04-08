import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Avatar, Text, useTheme } from 'react-native-paper';

const ChatListItem = ({ chat, onPress }) => {
  const { colors } = useTheme();

  return (
    <List.Item
      title={<Text style={{ color: colors.text }}>{chat.name}</Text>}
      description={<Text style={{ color: colors.textSecondary }}>{chat.lastMessage}</Text>}
      left={() => <ChatAvatar chat={chat} colors={colors} />}
      right={() => <ChatTime time={chat.time} colors={colors} />}
      onPress={onPress}
      style={styles.chatItem}
    />
  );
};

const ChatAvatar = ({ chat, colors }) => (
  <View>
    <Avatar.Image 
      size={50} 
      source={{ uri: chat.avatar }} 
      style={styles.avatar}
    />
    {chat.unread > 0 && (
      <UnreadBadge count={chat.unread} colors={colors} />
    )}
  </View>
);

const UnreadBadge = ({ count, colors }) => (
  <Avatar.Text 
    size={24} 
    label={count.toString()} 
    style={[styles.badge, { backgroundColor: colors.error }]}
  />
);

const ChatTime = ({ time, colors }) => (
  <Text style={[styles.time, { color: colors.textSecondary }]}>
    {time}
  </Text>
);

const styles = StyleSheet.create({
  avatar: {
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  time: {
    fontSize: 12,
  },
  chatItem: {
    paddingVertical: 12,
  },
});

export default ChatListItem;
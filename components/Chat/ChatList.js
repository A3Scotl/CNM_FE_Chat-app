import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import ChatListItem from "./ChatListItem";

const ChatList = ({ chats, onChatSelect, currentUserId }) => {
  if (!chats || chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ChatListItem 
          item={item} 
          onPress={onChatSelect} 
          userId={currentUserId} 
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});

export default ChatList;
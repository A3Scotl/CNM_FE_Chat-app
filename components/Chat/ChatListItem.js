import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
const ChatListItem = ({ item }) => {
  const navigation = useNavigation();
  const { user, lastMessage, chat } = item; // Assuming 'chat' is part of the item

  
  // Handle the onPress event to navigate to ChatScreen
  // Trong ChatListItem
  const handlePress = () => {
    navigation.navigate("Chat", {
      chat: item, // Truyền toàn bộ item
      user: user, // Truyền user để sử dụng trong màn hình Chat
      updateLastMessage: item.updateLastMessage, // Truyền updateLastMessage để cập nhật tin nhắn cuối cùng
    });
  };
  

  

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Avatar.Image
        size={48}
        source={{ uri: user?.avatar || "https://i.pravatar.cc/150" }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{user?.fullName || "Không tên"}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage?.content || "Bắt đầu trò chuyện"}
        </Text>
      </View>
      {lastMessage?.createdAt && (
        <Text style={styles.time}>
          {new Date(lastMessage.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
});

export default ChatListItem;

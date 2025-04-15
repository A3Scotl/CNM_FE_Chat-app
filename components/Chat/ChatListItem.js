import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Text } from "react-native-paper";

const ChatListItem = ({ item, onPress, route }) => {
  const { user, lastMessage } = item;

  // Sử dụng useEffect để cập nhật lại lastMessage khi có sự thay đổi từ route.params
  useEffect(() => {
    if (
      item._id === route?.params?.chat?._id &&
      route?.params?.updateLastMessage
    ) {
      route.params.updateLastMessage(item._id, {
        content: lastMessage?.content || "Bắt đầu trò chuyện",
        createdAt: new Date().toISOString(),
      });
    }
  }, [lastMessage, route, item]); // Theo dõi sự thay đổi của lastMessage và route

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)}>
      <Avatar.Image
        size={48}
        source={{ uri: user.avatar || "https://i.pravatar.cc/150" }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{user.fullName || "Không tên"}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage?.content || "Bắt đầu trò chuyện"}
        </Text>
      </View>
      {lastMessage?.createdAt && (
        <Text style={styles.time}>
          {lastMessage?.createdAt
            ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
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

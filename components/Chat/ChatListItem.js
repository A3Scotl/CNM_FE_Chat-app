// ChatListItem.js
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Text, Badge } from "react-native-paper";

const ChatListItem = ({ item, onPress, userId }) => {
  const { user, lastMessage, unreadCount } = item;

  const formatTime = (createdAt) => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return "";
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const displayMessageContent = () => {
    if (!lastMessage) {
      return "Bắt đầu trò chuyện";
    }

    // Xử lý tin nhắn thu hồi trước tiên
    if (lastMessage.isRevoke) {
      // Kiểm tra nếu có thông tin người thu hồi và người thu hồi là current user
      if (lastMessage.revokeBy && lastMessage.revokeBy._id === userId) {
        return "Bạn đã thu hồi tin nhắn";
      }
      // Kiểm tra nếu có thông tin người thu hồi và người thu hồi không phải là current user
      else if (lastMessage.revokeBy && lastMessage.revokeBy._id !== userId) {
        const revokerFullName = lastMessage.revokeBy.fullName;
        const nameParts = revokerFullName ? revokerFullName.split(' ') : [];
        const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "Ai đó"; // Fallback nếu không có tên
        return `${lastName} đã thu hồi tin nhắn`;
      }
      // Trường hợp fallback nếu không có thông tin revokeBy (chỉ hiển thị chung chung)
      return "Tin nhắn đã thu hồi";
    }

    // Nếu không phải tin nhắn thu hồi, hiển thị nội dung bình thường
    let prefix = '';
    if (lastMessage.sender && lastMessage.sender._id === userId) {
      prefix = 'Bạn: ';
    }

    switch (lastMessage.type) {
      case "image":
        return prefix + "Đã gửi ảnh";
      case "file":
        return prefix + "Đã gửi tệp";
      case "audio":
        return prefix + "Đã gửi âm thanh";
      default: // Đối với 'text' hoặc các loại khác
        return prefix + (lastMessage.content || "Bắt đầu trò chuyện");
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)}>
      <Avatar.Image
        size={48}
        source={{ uri: user?.avatar || "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg" }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{user?.fullName || "Không tên"}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {displayMessageContent()}
        </Text>
      </View>
      <View style={styles.rightContainer}>
        {lastMessage?.createdAt && (
          <Text style={styles.time}>{formatTime(lastMessage.createdAt)}</Text>
        )}
        {unreadCount > 0 && (
          <Badge style={styles.badge} size={20}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </View>
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
  rightContainer: {
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: "#007bff",
    color: "#fff",
    marginTop: 4,
  },
});

export default ChatListItem;
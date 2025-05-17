import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Text, Badge } from "react-native-paper";
import { useSocket } from "../../hooks/useSocket";
import { Audio } from "expo-av";
import ActionSheet from "react-native-actionsheet";
import { hideConversation } from "../../apis/message.api";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Thêm icon library

const ChatListItem = ({ item, onPress, userId }) => {
  const {
    user,
    lastMessage: initialLastMessage,
    type,
    unreadCount: initialUnreadCount,
  } = item;
  const actionSheetRef = React.createRef();

  const [lastMessage, setLastMessage] = useState(initialLastMessage);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [hasNewInvite, setHasNewInvite] = useState(false); // State cho lời mời mới
  const conversationId = item._id;

  const handleLongPress = () => {
    actionSheetRef.current.show();
  };

  const handleActionSheet = async (index) => {
    switch (index) {
      case 0:
        if (!conversationId) {
          console.error(
            "❌ Không thể ẩn cuộc trò chuyện, conversationId không hợp lệ."
          );
          return;
        }
        try {
          const response = await hideConversation(conversationId);
          console.log(response.message);
        } catch (error) {
          console.error("❌ Lỗi khi ẩn cuộc trò chuyện:", error);
        }
        break;
      default:
        console.log("Hủy");
        break;
    }
  };

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/message-notification.mp3")
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (err) {
      console.error("Lỗi phát âm thanh thông báo:", err);
    }
  };

  const handleNewMessage = async (message) => {
    if (message.conversationId === conversationId) {
      const senderId =
        typeof message.sender === "object"
          ? message.sender._id
          : message.sender;
      if (senderId !== userId) {
        await playNotificationSound();
        setUnreadCount((prev) => (prev || 0) + 1);
      }

      setLastMessage({
        _id: message._id,
        content:
          message.content ||
          (message.type === "image"
            ? "Hình ảnh"
            : message.type === "audio"
            ? "Tin nhắn âm thanh"
            : "Tệp"),
        sender: message.sender,
        createdAt: message.createdAt || new Date().toISOString(),
        type: message.type,
        fileMeta: message.fileMeta || [],
        replyTo: message.replyTo,
        isRevoke: message.isRevoke || false,
      });
    }
  };

  const handleNewGroupInvite = (invite) => {
    if (invite.groupId === conversationId && type === "group") {
      setHasNewInvite(true); // Hiển thị chấm đỏ khi có lời mời mới
      playNotificationSound();
    }
  };

  const { socket, joinRoom } = useSocket(userId, {
    onNewMessage: handleNewMessage,
    onNewGroupInvite: handleNewGroupInvite, // Bắt sự kiện lời mời nhóm
  });

  useEffect(() => {
    if (conversationId && joinRoom) {
      joinRoom(conversationId);
    }
  }, [conversationId, joinRoom]);

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

  const handlePress = () => {
    setHasNewInvite(false); // Xóa chấm đỏ khi nhấn vào item
    onPress(item);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
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
      <View style={styles.rightContainer}>
        {lastMessage?.createdAt && (
          <Text style={styles.time}>{formatTime(lastMessage.createdAt)}</Text>
        )}
        <View style={styles.badgeContainer}>
          {unreadCount > 0 && (
            <Badge style={styles.badge} size={20}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          {hasNewInvite && (
            <Badge style={[styles.badge, styles.inviteBadge]} size={20}>
              <MaterialCommunityIcons
                name="account-plus"
                size={12}
                color="#fff"
              />
            </Badge>
          )}
        </View>
      </View>
      <ActionSheet
        ref={actionSheetRef}
        options={["Xóa cuộc trò chuyện", "Hủy"]}
        cancelButtonIndex={1}
        destructiveButtonIndex={0}
        onPress={handleActionSheet}
      />
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
  badgeContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#007bff",
    color: "#fff",
    marginTop: 4,
  },
  inviteBadge: {
    backgroundColor: "#ff4444", // Màu đỏ cho badge lời mời
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatListItem;

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Text, Badge } from "react-native-paper";
import { useSocket } from "../../hooks/useSocket";
import { Audio } from "expo-av";

const ChatListItem = ({ item, onPress, userId }) => {
  const { user, lastMessage: initialLastMessage, type, unreadCount: initialUnreadCount } = item;
  const [lastMessage, setLastMessage] = useState(initialLastMessage);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const conversationId = item._id;

  // Play notification sound
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

  // Handle new messages
  const handleNewMessage = async (message) => {
    console.log("ChatListItem received message:", message, "for conversation:", conversationId);
    
    // Only update if the message belongs to this conversation
    if (message.conversationId === conversationId) {
      console.log("Message matches this conversation, updating UI");
      
      // Get sender ID in a consistent way
      const senderId = typeof message.sender === "object" ? message.sender._id : message.sender;
      console.log("Sender ID:", senderId, "Current user ID:", userId);
      
      // Play sound for messages from others
      if (senderId !== userId) {
        await playNotificationSound();
        // Increment unread count
        setUnreadCount((prev) => (prev || 0) + 1);
      }
      
      // Update the last message
      setLastMessage({
        _id: message._id,
        content: message.content || (
          message.type === "image" ? "Hình ảnh" : 
          message.type === "audio" ? "Tin nhắn âm thanh" : "Tệp"
        ),
        sender: senderId,
        createdAt: message.createdAt || new Date().toISOString(),
      });
    }
  };

  // Use the socket hook properly
  const { socket, joinRoom } = useSocket(userId, {
    onNewMessage: handleNewMessage
  });

  // Join the conversation room when component mounts
  useEffect(() => {
    if (conversationId && joinRoom) {
      console.log(`Joining room for conversation: ${conversationId}`);
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

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)}>
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
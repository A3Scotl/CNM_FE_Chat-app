import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, Text } from "react-native";
import ChatList from "../components/Chat/ChatList";
import { getMyConversations } from "../apis/conversation.api";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { Audio } from "expo-av";

const ConversationList = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyConversations();
      const data = response.data || [];
      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu cuộc trò chuyện không hợp lệ");
      }
      const mappedConversations = data.map((convo) => {
        if (convo.type === "group") {
          // console.log("convo",convo);
          return {
            _id: convo._id,
            user: { fullName: convo.name, avatar: convo.avatar || "https://i.pravatar.cc/150" },
            lastMessage: convo.lastMessage || null,
            type: "group",
            unreadCount: convo.unreadCount || 0,
            participants: convo.participants || [],
          };
        } else {
          const otherParticipant = convo.participants?.find(
            (p) => p._id !== currentUser._id
          ) || { fullName: "Unknown", avatar: "https://i.pravatar.cc/150" };
          return {
            _id: convo._id,
            user: otherParticipant,
            lastMessage: convo.lastMessage || null,
            type: "private",
            unreadCount: convo.unreadCount || 0,
          };
        }
      });

      mappedConversations.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : 0;
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : 0;
        return bTime - aTime;
      });

      setConversations(mappedConversations);
    } catch (error) {
      console.error("❌ Lỗi khi tải cuộc trò chuyện:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách cuộc trò chuyện.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Keep the group invite notification functionality
  useEffect(() => {
    let socketConnection;

    const setupSocket = async () => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        console.warn("Token hoặc userId không tồn tại, không thể kết nối socket");
        return;
      }

      socketConnection = io("https://be.haudev.io.vn", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket kết nối thành công trong ConversationList (cho lời mời nhóm)");
      });

      socketConnection.on("group-invite", async ({ groupId, inviteId }) => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("../assets/sounds/invire-group.mp3")
          );
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) sound.unloadAsync();
          });
          Alert.alert("Lời mời tham gia nhóm", `Bạn nhận được lời mời tham gia nhóm ${groupId}`);
          fetchConversations(); // Tải lại danh sách khi nhận lời mời nhóm
        } catch (err) {
          console.error("Lỗi phát âm thanh lời mời nhóm:", err);
        }
      });

      socketConnection.on("disconnect", (reason) => {
        console.log("Ngắt kết nối Socket.IO trong ConversationList. Lý do:", reason);
      });

      socketConnection.on("connect_error", (error) => {
        console.error("Lỗi kết nối Socket.IO trong ConversationList:", error);
      });
    };

    setupSocket();

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
        console.log("Socket.IO đã ngắt kết nối trong ConversationList");
      }
    };
  }, [fetchConversations]);

  const handleChatSelect = (chat) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === chat._id ? { ...c, unreadCount: 0 } : c
      )
    );
    // console.log("Chat:",chat);
    navigation.navigate("Chat", {
      conversationId: chat._id,
      chat:chat,
      user: currentUser,
    });
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchConversations();
    }
  }, [fetchConversations, currentUser]);
  
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : conversations.length === 0 ? (
        <Text style={styles.noResults}>Không có cuộc trò chuyện nào.</Text>
      ) : (
        <ChatList 
          chats={conversations} 
          onChatSelect={handleChatSelect} 
          currentUserId={currentUser?._id} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});

export default ConversationList;
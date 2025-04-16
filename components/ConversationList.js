import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, Text } from "react-native";
import ChatList from "../components/Chat/ChatList";
import { getMyConversations } from "../apis/conversation.api";
import { useNavigation } from "@react-navigation/native";

const ConversationList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getMyConversations();
      
      // Lọc các cuộc trò chuyện có đúng 2 người tham gia và xử lý dữ liệu
      const filteredConversations = data
        .filter((convo) => convo.participants.length === 2) // Chỉ chọn những cuộc trò chuyện có 2 người
        .map((convo) => {
          const otherParticipant = convo.participants.find(
            (p) => p._id !== currentUser._id
          ); // Lấy thông tin người tham gia còn lại
          return {
            _id: convo._id,
            user: otherParticipant,
            lastMessage: convo.lastMessage,
          };
        });
      setConversations(filteredConversations);
    } catch (error) {
      console.error("❌ Lỗi khi tải cuộc trò chuyện:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách cuộc trò chuyện.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    navigation.navigate("ChatDetail", { conversationId: chat._id });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : conversations.length === 0 ? (
        <Text style={styles.noResults}>Không có cuộc trò chuyện nào.</Text>
      ) : (
        <ChatList chats={conversations} onChatSelect={handleChatSelect} />
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

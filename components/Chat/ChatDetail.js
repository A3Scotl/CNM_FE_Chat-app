// ChatDetail.js
import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Text, TextInput, Button } from "react-native";
import { Avatar } from "react-native-paper";
import { getMessages } from "../../apis/message.api";  // API để lấy tin nhắn

const ChatDetail = ({ route, navigation }) => {
  const { conversationId, user } = route.params; // Lấy dữ liệu truyền qua từ màn hình ChatList

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Gọi API để lấy danh sách tin nhắn khi màn hình được render
    const fetchMessages = async () => {
      try {
        const data = await getMessages(conversationId);  // Gọi API lấy tin nhắn
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      // Logic gửi tin nhắn (gọi API sendMessage)
      setNewMessage("");  // Reset input
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image size={40} source={{ uri: user?.avatar || "https://i.pravatar.cc/150" }} />
        <Text style={styles.headerText}>{user?.fullName || "Không tên"}</Text>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Nhập tin nhắn..."
        />
        <Button title="Gửi" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    fontSize: 18,
    marginLeft: 12,
  },
  messageContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  message: {
    fontSize: 16,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 12,
    marginRight: 8,
  },
});

export default ChatDetail;

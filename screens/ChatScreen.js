import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Avatar, Text, useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import EmojiSelector from "react-native-emoji-selector";
import { getMessages } from "../apis/message.api";

// Lấy token từ AsyncStorage
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (error) {
    console.error("❌ Lỗi khi lấy token từ AsyncStorage:", error);
    return null;
  }
};

const ChatScreen = ({ navigation, route }) => {
  const { chat, user } = route.params;
  const { colors } = useTheme();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Focus vào TextInput khi component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cuộn ScrollView khi bàn phím mở hoặc đóng
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
      setShowEmojiPicker(false); // Ẩn emoji picker khi bàn phím đóng
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Lấy userId từ AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) {
          setUserId(id);
        }
      } catch (err) {
        console.error("Lỗi lấy userId:", err);
      }
    };
    fetchUserId();
  }, []);

  // Thiết lập socket
  useEffect(() => {
    const setupSocket = async () => {
      if (!userId || !chat._id) return;
      const token = await getToken();
      if (!token) return;

      const socketConnection = io("https://be.haudev.io.vn", {
        auth: { token },
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket connected");
        socketConnection.emit("join-room", chat._id);
        console.log("📥 Đã join phòng:", chat._id);
      });

      socketConnection.on("new-message", (msg) => {
        const isCurrentUser = String(msg.sender._id) === String(userId);

        setMessages((prev) => [
          ...prev,
          {
            content: msg.content,
            senderId: msg.sender._id,
            isCurrentUser,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      });

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
        console.log("⚠️ Socket disconnected");
      };
    };

    setupSocket();
  }, [chat._id, userId]);

  // Gửi tin nhắn
  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    try {
      const token = await getToken();

      const response = await fetch("https://be.haudev.io.vn/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: chat._id,
          sender: user._id,
          content: trimmedMessage,
          type: "text",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("");
        setShowEmojiPicker(false); // Ẩn emoji picker sau khi gửi
      } else {
        console.error("❌ Lỗi gửi tin nhắn:", data.message || data);
      }
    } catch (error) {
      console.error("❌ Gửi tin nhắn thất bại:", error);
    }
  };

  // Xử lý trạng thái typing
  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      socket.emit("typing", chat._id, user._id);
    }

    setTimeout(() => {
      socket.emit("stop-typing", chat._id, user._id);
      setTyping(false);
    }, 2000);
  };

  // Lấy danh sách tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat._id || !userId) return;

      try {
        const data = await getMessages(chat._id);

        const formattedMessages = data.map((msg) => {
          const isCurrentUser = String(msg.sender._id) === String(userId);
          return {
            content: msg.content,
            senderId: msg.sender._id,
            isCurrentUser,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
        setMessages(formattedMessages);
      } catch (error) {
        console.error("❌ Không thể tải tin nhắn:", error);
      }
    };

    fetchMessages();
  }, [chat._id, userId]);

  // Cuộn ScrollView khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0098f9" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar.Image
              size={40}
              source={{ uri: chat?.user?.avatar || "https://i.pravatar.cc/150" }}
            />
            <View style={styles.headerContent}>
              <Text style={styles.chatName}>{chat?.user?.fullName || "Không tên"}</Text>
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        </View>

        {/* Tin nhắn */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatContent}
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[styles.messageBubble, msg.isCurrentUser ? styles.messageMe : styles.messageOther]}
            >
              <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
                {msg.content}
              </Text>
              <Text style={styles.timestamp}>{msg.timestamp}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <View style={styles.emojiPickerContainer}>
            <EmojiSelector
              onEmojiSelected={(emoji) => {
                setMessage((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              columns={8}
            />
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <MaterialIcons name="insert-emoticon" size={24} color="#666" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChangeText={setMessage}
            multiline
            keyboardType="default"
            autoCorrect={false}
            onFocus={() => {
              handleTyping();
              setShowEmojiPicker(false); // Ẩn emoji picker khi focus vào TextInput
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
            }}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!message.trim()}>
            <MaterialIcons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Typing Indicator */}
        {typing && <Text style={styles.typingText}>User is typing...</Text>}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 40 },
  header: {
    backgroundColor: "white",
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerContent: { marginLeft: 12 },
  chatName: { fontSize: 18, fontWeight: "bold" },
  statusText: { fontSize: 12, color: "#666" },
  chatContent: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
  messageBubble: {
    marginVertical: 8,
    padding: 10,
    borderRadius: 16,
    maxWidth: "80%",
  },
  messageMe: { alignSelf: "flex-end", backgroundColor: "#0e76a8" },
  messageOther: { alignSelf: "flex-start", backgroundColor: "#f1f1f1" },
  messageTextMe: { color: "white" },
  messageTextOther: { color: "black" },
  timestamp: { fontSize: 10, color: "#666", marginTop: 4 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#0098f9",
    padding: 10,
    borderRadius: 20,
  },
  typingText: { textAlign: "center", fontSize: 12, color: "#888", marginTop: 4 },
  emojiPickerContainer: {
    height: 200,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});

export default ChatScreen;
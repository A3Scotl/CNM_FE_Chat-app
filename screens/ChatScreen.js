import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Avatar, Text, useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { createSocket } from "../utils/socket"; // Đảm bảo tạo socket từ hàm này
import { sendMessage, getMessages } from "../apis/message.api";

const ChatScreen = ({ navigation, route }) => {
  const { chat, user } = route.params;
  const { colors } = useTheme();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false); // Trạng thái typing
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const updateLast = (content, createdAt) => {
    route.params?.updateLastMessage?.(chat._id, {
      content,
      createdAt,
    });
  };

  // Auto scroll to bottom when messages change
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!message.trim() || sending) return; // Nếu đang gửi, không gửi lại
    setSending(true); // Đánh dấu đang gửi tin nhắn
    route.params?.updateLastMessage?.(chat._id, {
      content: message,
      createdAt: new Date().toISOString(),
    });

    const newMsg = {
      conversationId: chat._id,
      sender: user._id,
      content: message.trim(),
      type: "text",
    };
    console.log("📩 Gửi tin nhắn:", newMsg.content);
    try {
      const res = await sendMessage(newMsg, user.token);
      const saved = res.data;

      setMessages((prev) => [
        ...prev,
        {
          ...saved,
          _id: saved._id || Date.now().toString(),
          senderId: "me",
          timestamp: new Date(saved.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      setMessage("");
      setTyping(false); // Khi gửi tin nhắn, dừng trạng thái typing
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
    } finally {
      setSending(false); // Kết thúc gửi
    }
  };

  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      socketRef.current?.emit("typing", chat._id, user._id); // Phát sự kiện typing
    }
  };

  useEffect(() => {
    if (!user?.token || !user._id || !chat._id) return;

    const socket = createSocket(user.token);
    socketRef.current = socket;
    /// Debug log to check if socket connects
    socket.on("connect", () => {
      console.log("🔌 Socket connected");
      socket.emit("join-room", chat._id); // Make sure to join the room
      console.log("✅ Đã join room:", chat._id);
    });
    const handleReceiveMessage = (msg) => {
      const senderId =
        typeof msg.sender === "object" ? msg.sender._id : msg.sender;

      // Kiểm tra xem tin nhắn này có phải do người gửi gửi hay không
      if (senderId === user._id) {
        return; // Nếu là tin nhắn của người gửi, không thêm lại vào list
      }

      // Kiểm tra xem tin nhắn này đã có trong danh sách chưa
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) {
          return prev; // Không thêm nếu tin nhắn đã có
        }
        console.log("📩 Nhận tin nhắn:", msg);
        return [
          ...prev,
          {
            ...msg,
            senderId: senderId === user._id ? "me" : "other",
            timestamp: msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          },
        ];
      });
    };

    // Lắng nghe sự kiện typing từ người khác
    socket.on("typing", (userId) => {
      if (userId !== user._id) {
        setTyping(true);
      }
    });

    socket.on("stop-typing", (userId) => {
      if (userId !== user._id) {
        setTyping(false);
      }
    });

    // Lắng nghe tin nhắn mới
    socket.on("new-message", handleReceiveMessage);

    return () => {
      console.log("👋 Rời khỏi room:", chat._id);
      socket.emit("leave-room", chat._id); // Rời khỏi phòng chat
      socket.off("new-message", handleReceiveMessage); // Hủy sự kiện lắng nghe tin nhắn mới
      socket.disconnect(); // Ngắt kết nối socket
      console.log("❌ Socket disconnected");
    };
  }, [chat._id]);

  // Load tin nhắn cũ
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.token || !chat._id) return;
      try {
        const res = await getMessages(chat._id, user.token);
        const loadedMessages = res.data.map((msg) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender._id : msg.sender;
          return {
            ...msg,
            senderId: senderId === user._id ? "me" : "other",
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
        setMessages(loadedMessages);
      } catch (err) {
        console.error("❌ Error loading messages:", err);
      }
    };
    fetchMessages();
  }, [chat._id]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#0098f9" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar.Image
            size={40}
            source={{ uri: chat.avatar || "https://i.pravatar.cc/150" }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>

      {/* Tin nhắn */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatContent}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {messages.map((msg, index) => (
          <View
            key={`${msg._id || msg.id}-${index}`} // sửa tại đây
            style={[
              styles.messageBubble,
              msg.senderId === "me" ? styles.messageMe : styles.messageOther,
            ]}
          >
            <Text
              style={
                msg.senderId === "me"
                  ? styles.messageTextMe
                  : styles.messageTextOther
              }
            >
              {msg.content}
            </Text>
            <Text style={styles.timestamp}>{msg.timestamp}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity>
          <MaterialIcons name="insert-emoticon" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="attach-file" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="camera-alt" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="mic" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          multiline
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          onFocus={handleTyping} // Khi người dùng bắt đầu gõ
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialIcons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Typing Indicator */}
      {typing && <Text style={styles.typingText}>User is typing...</Text>}
    </View>
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
  chatContent: { flex: 1, padding: 16 },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "80%",
  },
  messageMe: {
    alignSelf: "flex-end",
    backgroundColor: "#0098f9",
    borderTopRightRadius: 0,
  },
  messageOther: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderTopLeftRadius: 0,
    elevation: 1,
  },
  messageTextMe: { color: "white" },
  messageTextOther: { color: "black" },
  timestamp: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#0098f9",
    borderRadius: 20,
    padding: 8,
  },
  statusText: { fontSize: 12, color: "#666" },
  typingText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ChatScreen;

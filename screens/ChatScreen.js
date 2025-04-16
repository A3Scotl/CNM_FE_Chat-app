import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Image, Alert } from "react-native";
import { Avatar, Text, useTheme, Card, Button, Portal, Modal } from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import EmojiSelector from "react-native-emoji-selector";
import { getMessages } from "../apis/message.api";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import mime from 'mime';
import { fromPairs } from "lodash";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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
            _id: msg._id,
            content: msg.content,
            senderId: msg.sender._id,
            isCurrentUser,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: msg.type,
            fileMeta: msg.fileMeta || []
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

  // Yêu cầu quyền truy cập thư viện ảnh
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh để gửi hình ảnh');
      }
    })();
  }, []);

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setSelectedMedia({
          uri: selectedAsset.uri,
          type: 'image',
          name: selectedAsset.uri.split('/').pop()
        });
        setSelectedFile(null); // Xóa file nếu đã chọn trước đó
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh lúc này, vui lòng thử lại sau.");
    }
  };

  // Chọn file từ thư viện
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFile({
          uri: result.uri,
          name: result.name,
          type: mime.getType(result.name) || 'application/octet-stream',
          size: result.size
        });
        setSelectedMedia(null); // Xóa ảnh nếu đã chọn trước đó
      }
    } catch (error) {
      console.error("Lỗi khi chọn file:", error);
      Alert.alert("Lỗi", "Không thể chọn file lúc này, vui lòng thử lại sau.");
    }
  };

  // Hủy chọn media hoặc file
  const cancelMediaSelection = () => {
    setSelectedMedia(null);
    setSelectedFile(null);
  };

  // Gửi ảnh hoặc file
  const uploadMedia = async () => {
    try {
      setIsSending(true);
      const token = await getToken();
      console.log("Token:", token);
      console.log("Conversation ID:", chat._id);
      console.log("Sender ID:", user._id);
      console.log("Selected Media:", selectedMedia);
      console.log("Selected File:", selectedFile);
  
      const formData = new FormData();
      formData.append('conversationId', chat._id);
      formData.append('sender', user._id);
      if (message.trim()) {
        formData.append('content', message.trim());
      } else {
        formData.append('content', selectedMedia ? 'Đã gửi một hình ảnh' : 'Đã gửi một file');
      }
  
      if (selectedMedia) {
        const fileName = selectedMedia.uri.split('/').pop();
        const fileType = mime.getType(fileName) || 'image/jpeg';
        formData.append('type', 'image');
        formData.append('file', {
          uri: Platform.OS === 'ios' ? selectedMedia.uri.replace('file://', '') : selectedMedia.uri,
          name: fileName,
          type: fileType,
        });
      } else if (selectedFile) {
        formData.append('type', 'file');
        formData.append('file', {
          uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        });
      }
  
      console.log("FormData:", formData._parts);
  
      const response = await fetch("https://be.haudev.io.vn/api/message/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      const responseData = await response.json();
      console.log("Response:", responseData);
  
      if (response.ok) {
        setMessage("");
        setSelectedMedia(null);
        setSelectedFile(null);
      } else {
        console.error("Lỗi từ server:", responseData);
        Alert.alert("Lỗi", responseData.message || "Không thể gửi ảnh/file");
      }
    } catch (error) {
      console.error("Lỗi khi gửi media:", error);
      Alert.alert("Lỗi", "Không thể gửi file/ảnh, vui lòng thử lại sau.");
    } finally {
      setIsSending(false);
    }
  };

  // Gửi tin nhắn văn bản
  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !selectedMedia && !selectedFile) return;

    // Nếu có ảnh hoặc file được chọn, sử dụng hàm uploadMedia
    if (selectedMedia || selectedFile) {
      await uploadMedia();
      return;
    }

    try {
      setIsSending(true);
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
        Alert.alert("Lỗi", data.message || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("❌ Gửi tin nhắn thất bại:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn, vui lòng thử lại sau.");
    } finally {
      setIsSending(false);
    }
  };

  // Xử lý trạng thái typing
  const handleTyping = () => {
    if (!typing && socket) {
      setTyping(true);
      socket.emit("typing", chat._id, user._id);
    }

    setTimeout(() => {
      if (socket) {
        socket.emit("stop-typing", chat._id, user._id);
        setTyping(false);
      }
    }, 2000);
  };

  // Lấy danh sách tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat._id || !userId) return;

      setIsLoading(true);
      try {
        const data = await getMessages(chat._id);

        const formattedMessages = data.map((msg) => {
          const isCurrentUser = String(msg.sender._id) === String(userId);
          return {
            _id: msg._id,
            content: msg.content,
            senderId: msg.sender._id,
            isCurrentUser,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: msg.type || "text",
            fileMeta: msg.fileMeta || []
          };
        });
        setMessages(formattedMessages);
      } catch (error) {
        console.error("❌ Không thể tải tin nhắn:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chat._id, userId]);

  // Cuộn ScrollView khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Xem trước ảnh
  const openImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  // Hiển thị tin nhắn theo loại
  const renderMessageContent = (msg) => {
    if (msg.type === "text") {
      return <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>{msg.content}</Text>;
    } else if (msg.type === "image" && msg.fileMeta && msg.fileMeta.length > 0) {
      const imageUrl = msg.fileMeta[0].url;
      return (
        <TouchableOpacity onPress={() => openImagePreview(imageUrl)}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.messageImage} 
            resizeMode="cover"
          />
          {msg.content !== "Đã gửi một hình ảnh" && 
            <Text style={[styles.messageTextMe, { marginTop: 5 }]}>{msg.content}</Text>
          }
        </TouchableOpacity>
      );
    } else if (msg.type === "file" && msg.fileMeta && msg.fileMeta.length > 0) {
      const file = msg.fileMeta[0];
      return (
        <TouchableOpacity 
          style={styles.fileContainer}
          onPress={() => {
            // Mở file hoặc tải xuống file
            Alert.alert("Thông báo", `File: ${file.originalname}\nSize: ${(file.size/1024).toFixed(2)} KB`);
          }}
        >
          <FontAwesome5 name="file-alt" size={24} color={msg.isCurrentUser ? "white" : "#444"} />
          <View style={styles.fileInfo}>
            <Text style={[msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther, { fontWeight: "bold" }]} numberOfLines={1}>
              {file.originalname}
            </Text>
            <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
              {(file.size/1024).toFixed(2)} KB
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      return <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>{msg.content}</Text>;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0098f9" />
              <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
            </View>
          ) : (
            messages.map((msg, index) => (
              <View
                key={index}
                style={[styles.messageBubble, msg.isCurrentUser ? styles.messageMe : styles.messageOther]}
              >
                {renderMessageContent(msg)}
                <Text style={styles.timestamp}>{msg.timestamp}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Media Preview */}
        {selectedMedia && (
          <View style={styles.mediaPreviewContainer}>
            <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreview} />
            <TouchableOpacity style={styles.cancelMediaButton} onPress={cancelMediaSelection}>
              <MaterialIcons name="close" size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* File Preview */}
        {selectedFile && (
          <View style={styles.filePreviewContainer}>
            <View style={styles.filePreview}>
              <FontAwesome5 name="file-alt" size={24} color="#444" />
              <Text style={styles.fileNameText} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSizeText}>
                {(selectedFile.size/1024).toFixed(2)} KB
              </Text>
            </View>
            <TouchableOpacity style={styles.cancelFileButton} onPress={cancelMediaSelection}>
              <MaterialIcons name="close" size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}

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
          <View style={styles.inputButtonsContainer}>
            <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.inputIcon}>
              <MaterialIcons name="insert-emoticon" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={styles.inputIcon}>
              <MaterialIcons name="photo" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickDocument} style={styles.inputIcon}>
              <MaterialIcons name="attach-file" size={24} color="#666" />
            </TouchableOpacity>
          </View>
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
              setShowEmojiPicker(false);
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
            }}
          />
          <TouchableOpacity 
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]} 
            onPress={handleSend} 
            disabled={isSending || (!message.trim() && !selectedMedia && !selectedFile)}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Image Preview Modal */}
        <Portal>
          <Modal visible={showImagePreview} onDismiss={() => setShowImagePreview(false)} contentContainerStyle={styles.imagePreviewModal}>
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: previewImage }} style={styles.fullSizeImage} resizeMode="contain" />
              <TouchableOpacity 
                style={styles.closePreviewButton} 
                onPress={() => setShowImagePreview(false)}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </Modal>
        </Portal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 40, paddingBottom: 20 },
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
  inputButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#0098f9",
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: "#99CDF7",
  },
  typingText: { textAlign: "center", fontSize: 12, color: "#888", marginTop: 4 },
  emojiPickerContainer: {
    height: 200,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  mediaPreviewContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "relative",
  },
  mediaPreview: {
    height: 100,
    borderRadius: 8,
    marginRight: 50,  // Space for the cancel button
  },
  cancelMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  filePreviewContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "relative",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginRight: 30,
  },
  fileNameText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  fileSizeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  cancelFileButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  fileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  imagePreviewModal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
    width: "100%",
    height: "100%",
  },
  imagePreviewContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullSizeImage: {
    width: "100%",
    height: "80%",
  },
  closePreviewButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});

export default ChatScreen;
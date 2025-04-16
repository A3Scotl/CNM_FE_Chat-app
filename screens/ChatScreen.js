import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Image,
  Alert,
  Text as RNText
} from "react-native";
import { Avatar, Text, useTheme, Portal, Modal } from "react-native-paper";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import EmojiSelector from "react-native-emoji-selector";
import { getMessages } from "../apis/message.api";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import mime from 'mime';

const ChatScreen = ({ navigation, route }) => {
  // Guard against undefined route.params
  if (!route?.params || !route.params.chat || !route.params.user) {
    console.warn("ChatScreen: Thiếu route.params", { routeParams: route?.params });
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải hội thoại. Vui lòng thử lại.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { chat, user } = route.params;
  const { colors } = useTheme();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const viewRefs = useRef({});
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [focusedMessage, setFocusedMessage] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Validate conversationId
  useEffect(() => {
    if (!chat?._id) {
      console.warn("ChatScreen: conversationId không hợp lệ", { chatId: chat?._id });
      Alert.alert("Lỗi", "Hội thoại không tồn tại. Vui lòng quay lại danh sách hội thoại.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  }, [chat?._id, navigation]);

  // Focus TextInput on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
      setShowEmojiPicker(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) setUserId(id);
      } catch (err) {
        console.error("Lỗi khi lấy userId:", err);
      }
    };
    fetchUserId();
  }, []);

  // Request permissions for media and audio
  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Cần quyền truy cập thư viện để gửi hình ảnh');
      }

      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Cần quyền truy cập micro để ghi âm');
      }
    })();
  }, []);

  // Setup socket connection with reconnection
  useEffect(() => {
    const setupSocket = async () => {
      if (!userId || !chat._id) return;
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const socketConnection = io("https://be.haudev.io.vn", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket kết nối thành công");
        socketConnection.emit("join-room", chat._id);
      });

      socketConnection.on("connect_error", (err) => {
        console.error("Lỗi kết nối socket:", err);
      });

      socketConnection.on("new-message", (msg) => {
        const isCurrentUser = String(msg.sender._id) === String(userId);
        const newMessage = {
          _id: msg._id,
          content: msg.content,
          sender: msg.sender,
          isCurrentUser,
          timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: msg.type,
          fileMeta: msg.fileMeta || [],
          replyTo: msg.replyTo
        };

        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
      };
    };

    setupSocket();
  }, [chat._id, userId]);

  // Fetch messages and scroll to end
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat._id || !userId) return;

      setIsLoading(true);
      try {
        const data = await getMessages(chat._id, userId);
        const formattedMessages = data.map((msg) => {
          const isCurrentUser = String(msg.sender._id) === String(userId);
          return {
            _id: msg._id,
            content: msg.content,
            sender: msg.sender,
            isCurrentUser,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: msg.type || "text",
            fileMeta: msg.fileMeta || [],
            replyTo: msg.replyTo
          };
        });
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Lỗi tải tin nhắn:", error);
        Alert.alert("Lỗi", "Không thể tải tin nhắn. Hội thoại có thể không tồn tại.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chat._id, userId, navigation]);

  // Scroll to end when messages load or update
  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages]);

  // Handle reply and focus
  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const focusMessage = (messageId) => {
    setFocusedMessage(messageId);
    if (viewRefs.current[messageId] && scrollRef.current) {
      viewRefs.current[messageId].measureInWindow((x, y, width, height) => {
        if (y !== undefined) {
          scrollRef.current.scrollTo({ y: y - 100, animated: true }); 
          setTimeout(() => setFocusedMessage(null), 2000); 
        } else {
          console.warn('Vị trí y không xác định cho messageId:', messageId);
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      });
    } else {
      console.warn('Không tìm thấy ref cho messageId:', messageId);
      scrollRef.current?.scrollToEnd({ animated: true }); // Fallback
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      if (Platform.OS === 'ios') {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
          });
        } catch (modeErr) {
          console.warn('setAudioModeAsync không khả dụng, tiếp tục ghi âm:', modeErr);
        }
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Lỗi bắt đầu ghi âm:', err);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setSelectedFile({
        uri,
        name: `recording-${Date.now()}.m4a`,
        type: 'audio/m4a',
        size: 0 // expo-av không cung cấp kích thước
      });
      setSelectedMedia(null);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Lỗi dừng ghi âm:', err);
      Alert.alert('Lỗi', 'Không thể dừng ghi âm');
    }
  };

  // Play audio
  const playAudio = async (uri) => {
    if (!uri) {
      Alert.alert('Lỗi', 'Không có file âm thanh để phát');
      return;
    }
  
    try {
      // Kiểm tra định dạng file và platform
      const fileExt = uri.split('.').pop().toLowerCase();
      const isWebm = fileExt === 'webm';
      
      if (Platform.OS === 'ios' && isWebm) {
        Alert.alert('Thông báo', 'iOS không hỗ trợ phát file WEBM trực tiếp. Vui lòng chuyển đổi sang MP3/M4A');
        return;
      }
  
      // Cấu hình audio mode đúng cách
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });
  
      console.log('Đang phát âm thanh từ:', uri);
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
  
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
  
      await sound.playAsync();
    } catch (err) {
      console.error('Lỗi phát âm thanh:', err);
      Alert.alert('Lỗi', `Không thể phát âm thanh: ${err.message}`);
    }
  };

  // Get audio duration
  const getAudioDuration = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      return Math.round(status.durationMillis / 1000); // seconds
    } catch (err) {
      console.error('Lỗi lấy duration âm thanh:', err);
      return 0;
    }
  };

  // Pick image from library
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
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Lỗi chọn hình ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh, vui lòng thử lại.");
    }
  };

  // Pick document
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
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error("Lỗi chọn tài liệu:", error);
      Alert.alert("Lỗi", "Không thể chọn tài liệu, vui lòng thử lại.");
    }
  };

  // Cancel media/file selection
  const cancelMediaSelection = () => {
    setSelectedMedia(null);
    setSelectedFile(null);
  };

  // Upload file to S3
  const uploadToS3 = async (file) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        name: file.name,
        type: file.type,
      });

      const response = await fetch("https://be.haudev.io.vn/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Lỗi tải lên tệp");
      }

      return data.data.url;
    } catch (error) {
      console.error("Lỗi tải lên S3:", error);
      throw error;
    }
  };

  // Upload media
  const uploadMedia = async () => {
    if (!chat._id) {
      console.error("uploadMedia: conversationId không hợp lệ", { chatId: chat._id });
      Alert.alert("Lỗi", "Hội thoại không tồn tại. Vui lòng quay lại danh sách hội thoại.");
      return;
    }

    try {
      setIsSending(true);
      const token = await AsyncStorage.getItem("token");

      console.log("Gửi yêu cầu uploadMedia", { conversationId: chat._id, type: selectedMedia ? 'image' : 'audio' });

      let payload = {
        conversationId: chat._id,
        sender: user._id,
        type: selectedMedia ? 'image' : 'audio',
        content: message.trim() || (selectedMedia ? 'Đã gửi hình ảnh' : 'Đã gửi âm thanh'),
      };

      if (replyingTo) {
        payload.replyTo = replyingTo._id;
      }

      if (selectedMedia || selectedFile) {
        const file = selectedMedia || selectedFile;
        // Upload to S3
        const url = await uploadToS3(file);

        // Get duration for audio
        let duration = 0;
        if (file.type.startsWith('audio')) {
          duration = await getAudioDuration(file.uri);
        }

        payload.fileMeta = [{
          name: file.name,
          size: file.size || 0,
          mimeType: file.type,
          duration: duration || undefined,
          url
        }];
      }

      const response = await fetch("https://be.haudev.io.vn/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage("");
        setSelectedMedia(null);
        setSelectedFile(null);
        setReplyingTo(null);
      } else {
        console.error("Lỗi server:", responseData, { conversationId: chat._id });
        if (responseData.message === "Conversation not found") {
          Alert.alert(
            "Lỗi",
            "Hội thoại không tồn tại. Vui lòng quay lại danh sách hội thoại để chọn một hội thoại khác.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert("Lỗi", responseData.message || "Không thể gửi tệp");
        }
      }
    } catch (error) {
      console.error("Lỗi tải lên tệp:", error, { conversationId: chat._id });
      Alert.alert("Lỗi", "Không thể gửi tệp, vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  // Send text message
  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !selectedMedia && !selectedFile) return;

    if (selectedMedia || selectedFile) {
      await uploadMedia();
      return;
    }

    if (!chat._id) {
      console.error("handleSend: conversationId không hợp lệ", { chatId: chat._id });
      Alert.alert("Lỗi", "Hội thoại không tồn tại. Vui lòng quay lại danh sách hội thoại.");
      return;
    }

    try {
      setIsSending(true);
      const token = await AsyncStorage.getItem("token");

      console.log("Gửi yêu cầu handleSend", { conversationId: chat._id });

      const payload = {
        conversationId: chat._id,
        sender: user._id,
        content: trimmedMessage,
        type: "text",
      };

      if (replyingTo) {
        payload.replyTo = replyingTo._id;
      }

      const response = await fetch("https://be.haudev.io.vn/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage("");
        setShowEmojiPicker(false);
        setReplyingTo(null);
      } else {
        console.error("Lỗi gửi tin nhắn:", responseData, { conversationId: chat._id });
        if (responseData.message === "Conversation not found") {
          Alert.alert(
            "Lỗi",
            "Hội thoại không tồn tại. Vui lòng quay lại danh sách hội thoại để chọn một hội thoại khác.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert("Lỗi", responseData.message || "Không thể gửi tin nhắn");
        }
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error, { conversationId: chat._id });
      Alert.alert("Lỗi", "Không thể gửi tin nhắn, vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing status
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
    }, 750);
  };

  // Open image preview
  const openImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  // Render message content
  const renderMessage = (msg) => {
    if (msg.type === "image" && msg.fileMeta?.length > 0) {
      return (
        <TouchableOpacity onPress={() => openImagePreview(msg.fileMeta[0].url)}>
          <Image
            source={{ uri: msg.fileMeta[0].url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    } else if (msg.type === "audio" && msg.fileMeta?.length > 0) {
      return (
        <TouchableOpacity
          style={styles.audioContainer}
          onPress={() => playAudio(msg.content)}
        >
          <FontAwesome5 name="play-circle" size={24} color={msg.isCurrentUser ? "white" : "#444"} />
          <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
            Tin nhắn âm thanh
          </Text>
        </TouchableOpacity>
      );
    } else if (msg.type === "file" && msg.fileMeta?.length > 0) {
      return (
        <View style={styles.fileContainer}>
          <FontAwesome5 name="file-alt" size={24} color={msg.isCurrentUser ? "white" : "#444"} />
          <View style={styles.fileInfo}>
            <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
              {msg.fileMeta[0].name}
            </Text>
            <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
              {(msg.fileMeta[0].size / 1024).toFixed(2)} KB
            </Text>
          </View>
        </View>
      );
    }
    return (
      <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
        {msg.content}
      </Text>
    );
  };

  // Render reply preview
  const renderReplyPreview = () => {
    if (!replyingTo) return null;

    const isCurrentUserReply = replyingTo.isCurrentUser;
    const senderName = isCurrentUserReply ? "Bạn" : replyingTo.sender.fullName;

    let replyContent = "";
    if (replyingTo.type === "text") {
      replyContent = replyingTo.content;
    } else if (replyingTo.type === "image") {
      replyContent = "Hình ảnh";
    } else if (replyingTo.type === "audio") {
      replyContent = "Tin nhắn âm thanh";
    } else if (replyingTo.type === "file") {
      replyContent = "Tệp đính kèm";
    }

    return (
      <View style={styles.replyPreviewContainer}>
        <View style={styles.replyPreviewContent}>
          <View style={[styles.replyIndicator, { backgroundColor: isCurrentUserReply ? "#0e76a8" : "#f1f1f1" }]} />
          <View style={styles.replyTextContainer}>
            <Text style={styles.replySenderText}>Đang trả lời {senderName}</Text>
            <Text
              style={styles.replyContentText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {replyContent}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render replied message
  const renderReplyToMessage = (msg) => {
    if (!msg.replyTo) return null;
    const isCurrentUserReply = String(msg.replyTo.sender) === String(userId);
    const senderName = isCurrentUserReply ? "Bạn": msg.sender.fullName.split(" ").pop() ;
    let replyContent = "";
    if (msg.replyTo.type === "text") {
      replyContent = msg.replyTo.content;
    } else if (msg.replyTo.type === "image") {
      replyContent = "Hình ảnh";
    } else if (msg.replyTo.type === "audio") {
      replyContent = "Tin nhắn âm thanh";
    } else if (msg.replyTo.type === "file") {
      replyContent = "Tệp đính kèm";
    }

    return (
      <TouchableOpacity
        style={[
          styles.replyToContainer,
          msg.isCurrentUser ? styles.replyToContainerMe : styles.replyToContainerOther
        ]}
        onPress={() => focusMessage(msg.replyTo._id)}
      >
        <View style={[
          styles.replyIndicatorSmall,
          { backgroundColor: msg.isCurrentUser ? "white" : "#0e76a8" }
        ]} />
        <View>
          <Text style={[
            styles.replySenderTextSmall,
            { color: msg.isCurrentUser ? "white" : "#0e76a8" }
          ]}>
            {senderName}
          </Text>
          <Text
            style={[
              styles.replyContentTextSmall,
              { color: msg.isCurrentUser ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {replyContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
              <Text style={styles.chatName}>{chat?.user?.fullName || "Không có tên"}</Text>
              <Text style={styles.statusText}>Trực tuyến</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
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
                key={msg._id}
                ref={(ref) => (viewRefs.current[msg._id] = ref)}
                collapsable={false}
                style={[
                  styles.messageBubble,
                  msg.isCurrentUser ? styles.messageMe : styles.messageOther,
                  focusedMessage === msg._id && styles.focusedMessage
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => msg.replyTo && focusMessage(msg.replyTo._id)}
                  onLongPress={() => handleReply(msg)}
                  delayLongPress={2000}
                >
                  {renderReplyToMessage(msg)}
                  {renderMessage(msg)}
                  <RNText style={[
                    styles.timestamp,
                    { color: msg.isCurrentUser ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }
                  ]}>
                    {msg.timestamp}
                  </RNText>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Reply Preview */}
        {replyingTo && renderReplyPreview()}

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
              <FontAwesome5 name={selectedFile.type.startsWith('audio') ? "file-audio" : "file-alt"} size={24} color="#444" />
              <Text style={styles.fileNameText} numberOfLines={1}>{selectedFile.name}</Text>
              {selectedFile.size > 0 && (
                <Text style={styles.fileSizeText}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              )}
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
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={styles.inputIcon}
            >
              <MaterialIcons
                name={isRecording ? "stop" : "mic"}
                size={24}
                color={isRecording ? "#ff0000" : "#666"}
              />
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#0098f9",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
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
  messageMe: {
    alignSelf: "flex-end",
    backgroundColor: "#0e76a8",
    borderBottomRightRadius: 2,
  },
  messageOther: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
    borderBottomLeftRadius: 2,
  },
  messageTextMe: { color: "white" },
  messageTextOther: { color: "black" },
  timestamp: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
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
    marginRight: 50,
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
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
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
  replyPreviewContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  replyPreviewContent: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  replyIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 10,
  },
  replyTextContainer: {
    flex: 1,
  },
  replySenderText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  replyContentText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  cancelReplyButton: {
    marginLeft: 10,
  },
  replyToContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  replyToContainerMe: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  replyToContainerOther: {
    backgroundColor: "rgba(0,118,168,0.1)",
  },
  replyIndicatorSmall: {
    width: 3,
    height: 30,
    borderRadius: 2,
    marginRight: 8,
  },
  replySenderTextSmall: {
    fontWeight: "bold",
    fontSize: 12,
  },
  replyContentTextSmall: {
    fontSize: 12,
    marginTop: 2,
  },
  focusedMessage: {
    borderWidth: 2,
    borderColor: '#0098f9',
  },
});

export default ChatScreen;
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
  Text as RNText,
  FlatList,
} from "react-native";
import { Avatar, Text, useTheme, Portal, Modal, Button, IconButton } from "react-native-paper";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import EmojiSelector from "react-native-emoji-selector";
import { getMessages } from "../apis/message.api";
import {
  leaveGroup,
  getGroupMembersWithRoles,
  addGroupMember,
  removeGroupMember,
  updateGroupInfo,
  toggleRequireApproval,
  deleteGroup,
  changeMemberRole,
  getFriendsNotInGroup,
} from "../apis/conversationGroup.api";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import mime from "mime";

const ChatScreen = ({ navigation, route }) => {
  // Guard against undefined route.params
  if (!route?.params || !route.params.chat || !route.params.user) {
    console.warn("ChatScreen: Thiếu route.params", { routeParams: route?.params });
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải hội thoại. Vui lòng thử lại.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
  const [isTyping, setIsTyping] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupAvatar, setNewGroupAvatar] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Validate conversationId and fetch group details
  useEffect(() => {
    if (!chat?._id) {
      console.warn("ChatScreen: conversationId không hợp lệ", { chatId: chat?._id });
      Alert.alert("Lỗi", "Hội thoại không tồn tại. Vui lòng quay lại danh sách hội thoại.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else if (chat.type === "group") {
      fetchGroupDetails();
    }
  }, [chat?._id, navigation]);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      setConversationDetails(chat);
      console.log("details:",chat);

      const members = await getGroupMembersWithRoles(chat._id);
      console.log("members:",members);
      setGroupMembers(members.data);
      const currentMember = members.data.find((member) => member._id === user._id);
      setIsOwner(currentMember?.role === "owner");
      setIsAdmin(currentMember?.role === "admin" || currentMember?.role === "owner");
    } catch (error) {
      console.error("Không thể tải chi tiết nhóm:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết nhóm.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available friends for adding members
  const fetchAvailableFriends = async () => {
    try {
      const friends = await getFriendsNotInGroup(chat._id);
      setAvailableFriends(friends.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách bạn bè:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    }
  };

  // Focus input on mount
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
      if (mediaStatus !== "granted") {
        Alert.alert("Cần quyền truy cập", "Cần quyền truy cập thư viện để gửi hình ảnh");
      }

      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== "granted") {
        Alert.alert("Cần quyền truy cập", "Cần quyền truy cập micro để ghi âm");
      }
    })();
  }, []);

  // Setup socket connection
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

      socketConnection.on("new-message", async (msg) => {
        const isCurrentUser = String(msg.sender._id) === String(userId);
        const newMessage = {
          _id: msg._id,
          content: msg.content,
          sender: msg.sender,
          isCurrentUser,
          timestamp: new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: msg.type,
          fileMeta: msg.fileMeta || [],
          replyTo: msg.replyTo,
        };

        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);

        if (!isCurrentUser) {
          try {
            const { sound } = await Audio.Sound.createAsync(
              require("../assets/sounds/message-notification.mp3")
            );
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) sound.unloadAsync();
            });
          } catch (err) {
            console.error("Lỗi phát âm thanh thông báo:", err);
          }
        }
      });

      socketConnection.on("typing", (userIdTyping) => {
        if (userIdTyping !== userId) {
          setIsTyping(true);
        }
      });

      socketConnection.on("stop-typing", (userIdTyping) => {
        if (userIdTyping !== userId) {
          setIsTyping(false);
        }
      });

      socketConnection.on("group-update", ({ groupId, action, userId: actionUserId }) => {
        if (groupId === chat._id) {
          fetchGroupDetails(); // Refresh group data on update
          console.log(`Group updated: ${action} by user ${actionUserId}`);
        }
      });

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
      };
    };

    setupSocket();
  }, [chat._id, userId]);

  // Fetch messages
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
            timestamp: new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: msg.type || "text",
            fileMeta: msg.fileMeta || [],
            replyTo: msg.replyTo,
          };
        });
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Lỗi tải tin nhắn:", error);
        Alert.alert("Lỗi", "Không thể tải tin nhắn. Hội thoại có thể không tồn tại.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chat._id, userId, navigation]);

  // Scroll to end when messages update
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
          console.warn("Vị trí y không xác định cho messageId:", messageId);
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      });
    } else {
      console.warn("Không tìm thấy ref cho messageId:", messageId);
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      if (Platform.OS === "ios") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Lỗi bắt đầu ghi âm:", err);
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm");
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setSelectedFile({
        uri,
        name: `recording-${Date.now()}.m4a`,
        type: "audio/m4a",
        size: 0,
      });
      setSelectedMedia(null);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error("Lỗi dừng ghi âm:", err);
      Alert.alert("Lỗi", "Không thể dừng ghi âm");
    }
  };

  // Play audio
  const playAudio = async (uri) => {
    if (!uri) {
      Alert.alert("Lỗi", "Không có file âm thanh để phát");
      return;
    }

    try {
      const fileExt = uri.split(".").pop().toLowerCase();
      const isWebm = fileExt === "webm";

      if (Platform.OS === "ios" && isWebm) {
        Alert.alert("Thông báo", "iOS không hỗ trợ phát file WEBM trực tiếp.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
      await sound.playAsync();
    } catch (err) {
      console.error("Lỗi phát âm thanh:", err);
      Alert.alert("Lỗi", `Không thể phát âm thanh: ${err.message}`);
    }
  };

  // Get audio duration
  const getAudioDuration = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      return Math.round(status.durationMillis / 1000);
    } catch (err) {
      console.error("Lỗi lấy duration âm thanh:", err);
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
          type: "image",
          name: selectedAsset.uri.split("/").pop(),
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
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        setSelectedFile({
          uri: result.uri,
          name: result.name,
          type: mime.getType(result.name) || "application/octet-stream",
          size: result.size,
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
      formData.append("file", {
        uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
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
      Alert.alert("Lỗi", "Hội thoại không tồn tại.");
      return;
    }

    try {
      setIsSending(true);
      const token = await AsyncStorage.getItem("token");

      let payload = {
        conversationId: chat._id,
        sender: user._id,
        type: selectedMedia ? "image" : "audio",
        content: message.trim() || (selectedMedia ? "Đã gửi hình ảnh" : "Đã gửi âm thanh"),
      };

      if (replyingTo) {
        payload.replyTo = replyingTo._id;
      }

      if (selectedMedia || selectedFile) {
        const file = selectedMedia || selectedFile;
        const url = await uploadToS3(file);

        let duration = 0;
        if (file.type.startsWith("audio")) {
          duration = await getAudioDuration(file.uri);
        }

        payload.fileMeta = [
          {
            name: file.name,
            size: file.size || 0,
            mimeType: file.type,
            duration: duration || undefined,
            url,
          },
        ];
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
        console.error("Lỗi server:", responseData);
        Alert.alert("Lỗi", responseData.message || "Không thể gửi tệp");
      }
    } catch (error) {
      console.error("Lỗi tải lên tệp:", error);
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
      Alert.alert("Lỗi", "Hội thoại không tồn tại.");
      return;
    }

    try {
      setIsSending(true);
      const token = await AsyncStorage.getItem("token");

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
        if (socket) {
          socket.emit("send-message", {
            conversationId: chat._id,
            _id: responseData.data._id,
            content: trimmedMessage,
            sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
            createdAt: new Date().toISOString(),
            type: "text",
          });
        }
      } else {
        console.error("Lỗi gửi tin nhắn:", responseData);
        Alert.alert("Lỗi", responseData.message || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn, vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!chat._id) {
      Alert.alert("Lỗi", "Không thể rời nhóm: ID nhóm không hợp lệ.");
      return;
    }

    Alert.alert(
      "Xác nhận rời nhóm",
      "Bạn có chắc chắn muốn rời nhóm này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Rời nhóm",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGroup(chat._id);
              Alert.alert("Thành công", "Bạn đã rời nhóm thành công.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
              if (socket) {
                socket.emit("group-update", { groupId: chat._id, action: "leave", userId });
              }
            } catch (error) {
              console.error("Lỗi khi rời nhóm:", error);
              Alert.alert("Lỗi", error.message || "Không thể rời nhóm. Vui lòng thử lại.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    if (!chat._id) {
      Alert.alert("Lỗi", "Không thể giải tán nhóm: ID nhóm không hợp lệ.");
      return;
    }

    Alert.alert(
      "Xác nhận giải tán nhóm",
      "Bạn có chắc chắn muốn giải tán nhóm này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Giải tán",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(chat._id);
              Alert.alert("Thành công", "Nhóm đã được giải tán.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
              if (socket) {
                socket.emit("group-update", { groupId: chat._id, action: "delete", userId });
              }
            } catch (error) {
              console.error("Lỗi khi giải tán nhóm:", error);
              Alert.alert("Lỗi", error.message || "Không thể giải tán nhóm.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Handle update group info
  const handleUpdateGroupInfo = async () => {
    if (!newGroupName && !newGroupAvatar) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nhóm hoặc chọn ảnh mới.");
      return;
    }

    try {
      const payload = {};
      if (newGroupName) payload.name = newGroupName;
      if (newGroupAvatar) {
        const url = await uploadToS3(newGroupAvatar);
        payload.avatar = url;
      }

      const updatedGroup = await updateGroupInfo(chat._id, payload.name, payload.avatar);
      setConversationDetails(updatedGroup.data);
      setNewGroupName("");
      setNewGroupAvatar(null);
      Alert.alert("Thành công", "Cập nhật thông tin nhóm thành công.");
      if (socket) {
        socket.emit("group-update", { groupId: chat._id, action: "update", userId });
      }
    } catch (error) {
      console.error("Lỗi cập nhật thông tin nhóm:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật thông tin nhóm.");
    }
  };

  // Handle add member
  const handleAddMember = async (friendId) => {
    try {
      await addGroupMember(chat._id, friendId);
      Alert.alert("Thành công", "Thêm thành viên thành công.");
      await fetchGroupDetails();
      setShowAddMemberModal(false);
      if (socket) {
        socket.emit("group-update", { groupId: chat._id, action: "add-member", userId });
      }
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
      Alert.alert("Lỗi", error.message || "Không thể thêm thành viên.");
    }
  };

  // Handle remove member
  const handleRemoveMember = async (memberId) => {
    Alert.alert(
      "Xác nhận xóa thành viên",
      "Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await removeGroupMember(chat._id, memberId);
              Alert.alert("Thành công", "Xóa thành viên thành công.");
              await fetchGroupDetails();
              if (socket) {
                socket.emit("group-update", { groupId: chat._id, action: "remove-member", userId });
              }
            } catch (error) {
              console.error("Lỗi xóa thành viên:", error);
              Alert.alert("Lỗi", error.message || "Không thể xóa thành viên.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Handle change member role
  const handleChangeMemberRole = async (memberId, newRole) => {
    try {
      await changeMemberRole(chat._id, memberId, newRole);
      Alert.alert("Thành công", "Cập nhật quyền thành viên thành công.");
      await fetchGroupDetails();
      if (socket) {
        socket.emit("group-update", { groupId: chat._id, action: "change-role", userId });
      }
    } catch (error) {
      console.error("Lỗi thay đổi quyền:", error);
      Alert.alert("Lỗi", error.message || "Không thể thay đổi quyền.");
    }
  };

  // Handle toggle require approval
  const handleToggleRequireApproval = async () => {
    try {
      const result = await toggleRequireApproval(chat._id);
      Alert.alert(
        "Thành công",
        `Đã ${result.data.requireApproval ? "bật" : "tắt"} yêu cầu duyệt thành viên.`
      );
      await fetchGroupDetails();
    } catch (error) {
      console.error("Lỗi bật/tắt yêu cầu duyệt:", error);
      Alert.alert("Lỗi", error.message || "Không thể thay đổi cài đặt duyệt.");
    }
  };

  // Pick group avatar
  const pickGroupAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setNewGroupAvatar({
          uri: selectedAsset.uri,
          type: "image",
          name: selectedAsset.uri.split("/").pop(),
        });
      }
    } catch (error) {
      console.error("Lỗi chọn ảnh nhóm:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh, vui lòng thử lại.");
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
          <Image source={{ uri: msg.fileMeta[0].url }} style={styles.messageImage} resizeMode="cover" />
        </TouchableOpacity>
      );
    } else if (msg.type === "audio" && msg.fileMeta?.length > 0) {
      return (
        <TouchableOpacity style={styles.audioContainer} onPress={() => playAudio(msg.fileMeta[0].url)}>
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
      <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>{msg.content}</Text>
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
          <View
            style={[styles.replyIndicator, { backgroundColor: isCurrentUserReply ? "#0e76a8" : "#f1f1f1" }]}
          />
          <View style={styles.replyTextContainer}>
            <Text style={styles.replySenderText}>Đang trả lời {senderName}</Text>
            <Text style={styles.replyContentText} numberOfLines={1} ellipsizeMode="tail">
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
    const senderName = isCurrentUserReply ? "Bạn" : msg.sender.fullName.split(" ").pop();

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
        style={[styles.replyToContainer, msg.isCurrentUser ? styles.replyToContainerMe : styles.replyToContainerOther]}
        onPress={() => focusMessage(msg.replyTo._id)}
      >
        <View
          style={[styles.replyIndicatorSmall, { backgroundColor: msg.isCurrentUser ? "white" : "#0e76a8" }]}
        />
        <View>
          <Text style={[styles.replySenderTextSmall, { color: msg.isCurrentUser ? "white" : "#0e76a8" }]}>
            {senderName}
          </Text>
          <Text
            style={[styles.replyContentTextSmall, { color: msg.isCurrentUser ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {replyContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render chat info modal
  const renderChatInfoModal = () => {
    const isGroup = chat.type === "group";
    const images = messages.filter((msg) => msg.type === "image" && msg.fileMeta?.length > 0);

    return (
      <Portal style={{paddingHorizontal:50}}>
        <Modal
          visible={showChatInfoModal}
          onDismiss={() => setShowChatInfoModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isGroup ? "Thông tin nhóm" : "Thông tin đoạn chat"}
            </Text>
            <TouchableOpacity onPress={() => setShowChatInfoModal(false)}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Avatar và tên */}
            <View style={styles.modalAvatarContainer}>
              <TouchableOpacity onPress={isOwner || isAdmin ? pickGroupAvatar : null} disabled={!isOwner && !isAdmin}>
                <Avatar.Image
                  size={100}
                  source={{
                    uri:
                      isGroup && conversationDetails?.avatar
                        ? conversationDetails.avatar
                        : chat?.user?.avatar || "https://i.pravatar.cc/150",
                  }}
                />
                {(isOwner || isAdmin) && (
                  <View style={styles.editAvatarIcon}>
                    <MaterialIcons name="edit" size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
              {isGroup && (isOwner || isAdmin) && (
                <View style={styles.groupInfoEdit}>
                  <TextInput
                    style={styles.groupNameInput}
                    placeholder={chat.user.fullName}
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                  />
                  {newGroupAvatar && (
                    <Image source={{ uri: newGroupAvatar.uri }} style={styles.avatarPreview} />
                  )}
                  <Button
                    mode="contained"
                    onPress={handleUpdateGroupInfo}
                    style={styles.updateButton}
                    disabled={!newGroupName && !newGroupAvatar}
                  >
                    Cập nhật
                  </Button>
                </View>
              )}
             
            </View>

            {/* Thành viên (nếu là nhóm) */}
            {isGroup && (
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.modalSectionTitle}>
                    Thành viên ({groupMembers.length || 0})
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      fetchAvailableFriends();
                      setShowAddMemberModal(true);
                    }}
                  >
                    <Text style={styles.addMemberText}>+ Thêm thành viên</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={groupMembers}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.participantItem}>
                      <Avatar.Image
                        size={40}
                        source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
                      />
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{item.fullName}</Text>
                        <Text style={styles.participantRole}>
                          {item.role === "owner" ? "Chủ nhóm" : item.role === "admin" ? "Quản trị viên" : "Thành viên"}
                        </Text>
                      </View>
                      {isOwner && item._id !== user._id && (
                        <View style={styles.memberActions}>
                          <IconButton
                            icon="account-edit"
                            size={20}
                            onPress={() =>
                              Alert.alert(
                                "Thay đổi quyền",
                                "Chọn vai trò mới:",
                                [
                                  {
                                    text: "Thành viên",
                                    onPress: () => handleChangeMemberRole(item._id, "member"),
                                  },
                                  {
                                    text: "Quản trị viên",
                                    onPress: () => handleChangeMemberRole(item._id, "admin"),
                                  },
                                  {
                                    text: "Chủ nhóm",
                                    onPress: () => handleChangeMemberRole(item._id, "owner"),
                                  },
                                  { text: "Hủy", style: "cancel" },
                                ],
                                { cancelable: true }
                              )
                            }
                          />
                          <IconButton
                            icon="delete"
                            size={20}
                            onPress={() => handleRemoveMember(item._id)}
                            iconColor="#ff4444"
                          />
                        </View>
                      )}
                    </View>
                  )}
                  style={styles.participantList}
                />
              </View>
            )}

            {/* Ảnh đã gửi */}
            {images.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Ảnh đã gửi ({images.length})</Text>
                <FlatList
                  data={images}
                  keyExtractor={(item) => item._id}
                  horizontal
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openImagePreview(item.fileMeta[0].url)}>
                      <Image
                        source={{ uri: item.fileMeta[0].url }}
                        style={styles.sentImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  style={styles.imageList}
                />
              </View>
            )}

            {/* Cài đặt nhóm (nếu là nhóm) */}
            {isGroup && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Cài đặt nhóm</Text>
                {isOwner && (
                  <Button
                    mode="outlined"
                    onPress={handleToggleRequireApproval}
                    style={styles.modalButton}
                  >
                    {conversationDetails?.requireApproval
                      ? "Tắt yêu cầu duyệt thành viên"
                      : "Bật yêu cầu duyệt thành viên"}
                  </Button>
                )}
                <Button
                  mode="outlined"
                  onPress={handleLeaveGroup}
                  style={[styles.modalButton, { borderColor: "#ff4444" }]}
                  labelStyle={{ color: "#ff4444" }}
                >
                  Rời nhóm
                </Button>
                {isOwner && (
                  <Button
                    mode="outlined"
                    onPress={handleDeleteGroup}
                    style={[styles.modalButton, { borderColor: "#ff4444" }]}
                    labelStyle={{ color: "#ff4444" }}
                  >
                    Giải tán nhóm
                  </Button>
                )}
              </View>
            )}
          </ScrollView>
        </Modal>

        {/* Add Member Modal */}
        <Modal
          visible={showAddMemberModal}
          onDismiss={() => setShowAddMemberModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm thành viên</Text>
            <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableFriends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.participantItem}
                onPress={() => handleAddMember(item._id)}
              >
                <Avatar.Image
                  size={40}
                  source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
                />
                <Text style={styles.participantName}>{item.username}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text>Không có bạn bè nào để thêm.</Text>}
            style={styles.participantList}
          />
        </Modal>
      </Portal>
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
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            onPress={() => setShowChatInfoModal(true)}
          >
            <Avatar.Image
              size={40}
              source={{
                uri:
                  chat.type === "group" && conversationDetails?.avatar
                    ? conversationDetails.avatar
                    : chat?.user?.avatar || "https://i.pravatar.cc/150",
              }}
            />
            <View style={styles.headerContent}>
              <Text style={styles.chatName}>
                {chat.type === "group"
                  ? chat?.user?.fullName || "Nhóm không tên"
                  : chat?.user?.fullName || "Không có tên"}
              </Text>
              {isTyping ? (
                <Text style={styles.statusText}>Đang nhập...</Text>
              ) : (
                <Text style={styles.statusText}>
                  {chat.type === "group" ? `${groupMembers.length} thành viên` : "Trực tuyến"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
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
            messages.map((msg) => (
              <View
                key={msg._id}
                ref={(ref) => (viewRefs.current[msg._id] = ref)}
                collapsable={false}
                style={[
                  styles.messageContainer,
                  msg.isCurrentUser ? styles.messageContainerMe : styles.messageContainerOther,
                ]}
              >
                {!msg.isCurrentUser && (
                  <Avatar.Image
                    size={32}
                    source={{ uri: msg.sender?.avatar || "https://i.pravatar.cc/150" }}
                    style={styles.messageAvatar}
                  />
                )}
                <View
                  style={[
                    styles.messageBubble,
                    msg.isCurrentUser ? styles.messageMe : styles.messageOther,
                    focusedMessage === msg._id && styles.focusedMessage,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => msg.replyTo && focusMessage(msg.replyTo._id)}
                    onLongPress={() => handleReply(msg)}
                    delayLongPress={200}
                  >
                    {renderReplyToMessage(msg)}
                    {renderMessage(msg)}
                    <RNText
                      style={[
                        styles.timestamp,
                        { color: msg.isCurrentUser ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" },
                      ]}
                    >
                      {msg.timestamp}
                    </RNText>
                  </TouchableOpacity>
                </View>
                {msg.isCurrentUser && (
                  <Avatar.Image
                    size={32}
                    source={{ uri: user?.avatar || "https://i.pravatar.cc/150" }}
                    style={styles.messageAvatar}
                  />
                )}
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
              <FontAwesome5
                name={selectedFile.type.startsWith("audio") ? "file-audio" : "file-alt"}
                size={24}
                color="#444"
              />
              <Text style={styles.fileNameText} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              {selectedFile.size > 0 && (
                <Text style={styles.fileSizeText}>{(selectedFile.size / 1024).toFixed(2)} KB</Text>
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
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              style={styles.inputIcon}
            >
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
          <Modal
            visible={showImagePreview}
            onDismiss={() => setShowImagePreview(false)}
            contentContainerStyle={styles.imagePreviewModal}
          >
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: previewImage }}
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closePreviewButton}
                onPress={() => setShowImagePreview(false)}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </Modal>
        </Portal>

        {/* Chat Info Modal */}
        {renderChatInfoModal()}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5",paddingTop:30,paddingBottom:10 },
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
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 8,
  },
  messageContainerMe: {
    justifyContent: "flex-end",
  },
  messageContainerOther: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: "70%",
  },
  messageMe: {
    backgroundColor: "#0e76a8",
    borderBottomRightRadius: 2,
  },
  messageOther: {
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
    borderColor: "#0098f9",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
    maxHeight: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#0098f9",
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalChatName: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addMemberText: {
    fontSize: 14,
    color: "#0098f9",
  },
  participantList: {
    maxHeight: 200,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
  },
  participantRole: {
    fontSize: 14,
    color: "#666",
  },
  memberActions: {
    flexDirection: "row",
  },
  imageList: {
    maxHeight: 100,
  },
  sentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  modalButton: {
    marginTop: 10,
  },
  editAvatarIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
  groupInfoEdit: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  groupNameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    textAlign:"center"
  },
  avatarPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 10,
  },
  updateButton: {
    width: "100%",
  },
});

export default ChatScreen;
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
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
import Header from "../components/Chat/Header";
import MessageItem from "../components/Chat/MessageItem";
import ReplyPreview from "../components/Chat/ReplyPreview";
import MediaPreview from "../components/Chat/MediaPreview";
import InputBar from "../components/Chat/InputBar";
import ImagePreviewModal from "../components/Chat/ImagePreviewModal";
import ChatInfoModal from "../components/Chat/ChatInfoModal";

const ChatScreen = ({ navigation, route }) => {
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
      const members = await getGroupMembersWithRoles(chat._id);
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

  const fetchAvailableFriends = async () => {
    try {
      const friends = await getFriendsNotInGroup(chat._id);
      setAvailableFriends(friends.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách bạn bè:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
          fetchGroupDetails();
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

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages]);

  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const focusMessage = (messageId, isImage = false) => {
    if (isImage) {
      setPreviewImage(messageId);
      setShowImagePreview(true);
      return;
    }

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

  const cancelMediaSelection = () => {
    setSelectedMedia(null);
    setSelectedFile(null);
  };

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

  const handleToggleRequireApproval = async () => {
    try {
      console.log(groupMembers);
      const result = await toggleRequireApproval(chat._id);
      console.log(result);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <Header
          navigation={navigation}
          chat={chat}
          conversationDetails={conversationDetails}
          groupMembers={groupMembers}
          isTyping={isTyping}
          onInfoPress={() => setShowChatInfoModal(true)}
        />
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
              <MessageItem
                key={msg._id}
                msg={msg}
                user={user}
                userId={userId}
                onReply={handleReply}
                onFocus={focusMessage}
                viewRefs={viewRefs}
                playAudio={playAudio}
              />
            ))
          )}
        </ScrollView>
        <ReplyPreview replyingTo={replyingTo} onCancel={cancelReply} />
        <MediaPreview
          selectedMedia={selectedMedia}
          selectedFile={selectedFile}
          onCancel={cancelMediaSelection}
        />
        <InputBar
          message={message}
          setMessage={setMessage}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          isRecording={isRecording}
          isSending={isSending}
          selectedMedia={selectedMedia}
          selectedFile={selectedFile}
          onSend={handleSend}
          onPickImage={pickImage}
          onPickDocument={pickDocument}
          onToggleRecording={isRecording ? stopRecording : startRecording}
          onTyping={handleTyping}
          inputRef={inputRef}
          scrollRef={scrollRef}
        />
        <ImagePreviewModal
          visible={showImagePreview}
          imageUrl={previewImage}
          onDismiss={() => setShowImagePreview(false)}
        />
        <ChatInfoModal
          visible={showChatInfoModal}
          onDismiss={() => setShowChatInfoModal(false)}
          chat={chat}
          conversationDetails={conversationDetails}
          messages={messages}
          groupMembers={groupMembers}
          isOwner={isOwner}
          isAdmin={isAdmin}
          user={user}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          newGroupAvatar={newGroupAvatar}
          setNewGroupAvatar={setNewGroupAvatar}
          showAddMemberModal={showAddMemberModal}
          setShowAddMemberModal={setShowAddMemberModal}
          availableFriends={availableFriends}
          onPickAvatar={pickGroupAvatar}
          onUpdateGroupInfo={handleUpdateGroupInfo}
          onToggleRequireApproval={handleToggleRequireApproval}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onChangeMemberRole={handleChangeMemberRole}
          onFetchAvailableFriends={fetchAvailableFriends}
          onOpenImagePreview={(url) => {
            setPreviewImage(url);
            setShowImagePreview(true);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 30, paddingBottom: 10 },
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
  chatContent: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
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
});

export default ChatScreen;
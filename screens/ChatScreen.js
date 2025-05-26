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
  Modal,
  FlatList,
  TextInput,
  Linking
} from "react-native";
import { Text, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { getMessages, sendMessage, hideConversation, recallMessage, forwardMessage, forwardManyMessage, sendEmoji, revokeEmoji } from "../apis/message.api";
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
import { getMyConversations } from "../apis/conversation.api";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import mime from "mime";
import Header from "../components/Chat/Header";
import MessageItem from "../components/Chat/MessageItem";
import ChatInfoModal from "../components/Chat/ChatInfoModal";
import ReplyPreview from "../components/Chat/ReplyPreview";
import MediaPreview from "../components/Chat/MediaPreview";
import InputBar from "../components/Chat/InputBar";
import ImagePreviewModal from "../components/Chat/ImagePreviewModal";
import { API_URL, SOCKET_URL } from "@env";

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
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
  const [returnToChatInfo, setReturnToChatInfo] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessageData, setForwardMessageData] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [additionalContent, setAdditionalContent] = useState("");
  const [isTogglingApproval, setIsTogglingApproval] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);


  useEffect(() => {
    if (!chat?._id) {
      console.warn("ChatScreen: conversationId không hợp lệ", { chatId: chat?._id });
    } else if (chat.type === "group") {
      fetchMemberInGroupDetails();
    }
  }, [chat?._id, navigation]);

  const fetchMemberInGroupDetails = async () => {
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

  const fetchConversations = async () => {
    try {
      const response = await getMyConversations();
      const data = response.data || [];
      const mappedConversations = data
        .filter((convo) => convo._id !== chat._id)
        .map((convo) => ({
          _id: convo._id,
          name: convo.type === "group" ? convo.name : convo.participants.find(p => p._id !== userId)?.fullName || "Unknown",
          avatar: convo.type === "group" ? convo.avatar : convo.participants.find(p => p._id !== userId)?.avatar || "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
          type: convo.type,
        }));
      setConversations(mappedConversations);
      setFilteredConversations(mappedConversations);
    } catch (error) {
      console.error("Lỗi lấy danh sách cuộc trò chuyện:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách cuộc trò chuyện.");
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
    fetchConversations();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
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
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Cần quyền truy cập", "Cần quyền truy cập micro để ghi âm");
      }

      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== "granted") {
        Alert.alert("Cần quyền truy cập", "Cần quyền truy cập thư viện để gửi hình ảnh");
      }
    })();
  }, []);

  useEffect(() => {
    const setupSocket = async () => {
      if (!userId || !chat._id) return;
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const socketConnection = io(SOCKET_URL || "https://be.haudev.io.vn", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket kết nối thành công");
        socketConnection.emit("join-room", chat._id);
        socketConnection.emit("register", userId);
      });

      socketConnection.on("connect_error", (err) => {
        console.error("Lỗi kết nối socket:", err);
      });

      socketConnection.on("new-message", async (msg) => {
        console.log("Received new-message:", { _id: msg._id, content: msg.content });
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
          isRevoke: msg.isRevoke || false,
          forwardedMessage: msg.forwardedMessage || null,
          additionalContent: msg.additionalContent || "",
          emoji: msg.emoji || {},
        };

        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) {
            console.log(`Duplicate message skipped in new-message: ${msg._id}`);
            return prev;
          }
          console.log(`Adding new message: ${msg._id}`);
          return [...prev, newMessage];
        });

        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);

        if (!isCurrentUser) {
          try {
            const sound = new Audio.Sound();
            await sound.loadAsync(require("../assets/sounds/message-notification.mp3"));
            await sound.playAsync();
            await sound.unloadAsync();
          } catch (err) {
            console.error("Error playing notification sound:", err);
          }
        }
      });

      socketConnection.on("message-recalled", (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === updatedMessage._id
              ? { ...msg, content: updatedMessage.content, isRevoke: true, fileMeta: [], type: "text", forwardedMessage: null }
              : msg
          )
        );
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

      socketConnection.on("group:member-added", ({ groupId, addedUserId, addedBy }) => {
        if (groupId === chat._id) {
          fetchMemberInGroupDetails();
          if (addedBy !== userId) {
            Alert.alert("Thành viên mới", `Một người dùng đã được thêm vào nhóm.`);
            try {
              const sound = new Audio.Sound();
              sound.loadAsync(require("../assets/sounds/invite-group.mp3")).then(() => {
                sound.playAsync().then(() => {
                  sound.unloadAsync();
                });
              });
            } catch (err) {
              console.error("Lỗi phát âm thanh thông báo:", err);
            }
          }
        }
      });

      socketConnection.on("group:member-removed", ({ groupId, removedUserId, removedBy }) => {
        console.log("Nhận sự kiện group:member-removed:", { groupId, removedUserId, removedBy });
        if (groupId === chat._id) {
          if (removedUserId === userId) {
            Alert.alert("Thông báo", "Bạn đã bị xóa khỏi nhóm.", [
              {
                text: "OK",
                onPress: () => {
                  socketConnection.emit("leave-room", chat._id);
                  navigation.replace("Home");
                },
              },
            ]);
            setTimeout(() => {
              socketConnection.emit("leave-room", chat._id);
              navigation.replace("Home");
            }, 1000);
          } else {
            fetchMemberInGroupDetails();
            if (removedBy !== userId) {
              try {
                const sound = new Audio.Sound();
                sound.loadAsync(require("../assets/sounds/invite-group.mp3")).then(() => {
                  sound.playAsync().then(() => {
                    sound.unloadAsync();
                  });
                });
              } catch (err) {
                console.error("Lỗi phát âm thanh thông báo:", err);
              }
            }
          }
        }
      });

      socketConnection.on("group:memberLeft", ({ groupId, leftUserId }) => {
        if (groupId === chat._id) {
          fetchMemberInGroupDetails();
          if (leftUserId === userId) {
            navigation.goBack();
          } else {
            Alert.alert("Thành viên rời nhóm", `Một thành viên đã rời khỏi nhóm.`);
            try {
              const sound = new Audio.Sound();
              sound.loadAsync(require("../assets/sounds/invite-group.mp3")).then(() => {
                sound.playAsync().then(() => {
                  sound.unloadAsync();
                });
              });
            } catch (err) {
              console.error("Lỗi phát âm thanh thông báo:", err);
            }
          }
        }
      });

      socketConnection.on("group:deleted", ({ groupId }) => {
        console.log("Nhận sự kiện group:deleted:", { groupId });
        if (groupId === chat._id) {
          setTimeout(() => {
            socketConnection.emit("leave-room", chat._id);
            navigation.replace("Home");
          }, 1000);
        }
      });

      socketConnection.on("group:infoUpdated", ({ groupId, name, avatar }) => {
        if (groupId === chat._id) {
          setConversationDetails((prev) => {
            const newDetails = {
              ...prev,
              name: name || prev.name,
              avatar: avatar || prev.avatar,
              user: {
                ...prev.user,
                fullName: name || prev.user.fullName,
                avatar: avatar || prev.user.avatar,
              },
            };
            console.log("group:infoUpdated - Updated conversationDetails:", newDetails);
            return newDetails;
          });
        }
      });

      socketConnection.on("group:memberRoleChanged", ({ groupId, userId: affectedUserId, newRole }) => {
        if (groupId === chat._id) {
          fetchMemberInGroupDetails();
          if (affectedUserId !== userId) {
            const roleText = newRole === "owner" ? "chủ nhóm" : newRole === "admin" ? "quản trị viên" : "thành viên";
            try {
              const sound = new Audio.Sound();
              sound.loadAsync(require("../assets/sounds/invite-group.mp3")).then(() => {
                sound.playAsync().then(() => {
                  sound.unloadAsync();
                });
              });
            } catch (err) {
              console.error("Lỗi phát âm thanh thông báo:", err);
            }
          }
        }
      });

      socketConnection.on("emoji-updated", (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === updatedMessage._id
              ? { ...msg, emoji: updatedMessage.emoji || {} }
              : msg
          )
        );
      });

      socketConnection.on("group:requireApprovalChanged", ({ groupId, requireApproval }) => {
        console.log("Nhận sự kiện group:requireApprovalChanged:", { groupId, requireApproval });
        if (groupId === chat._id) {
          setConversationDetails((prev) => ({
            ...prev,
            requireApproval,
          }));
        }
      });

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
      };
    };

    setupSocket();
  }, [chat._id, userId, isTogglingApproval]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat._id || !userId) return;

      setIsLoading(true);
      try {
        const data = await getMessages(chat._id, userId);
        const formattedMessages = data.messages.map((msg) => {
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
            isRevoke: msg.isRevoke || false,
            forwardedMessage: msg.forwardedMessage || null,
            additionalContent: msg.additionalContent || "",
            emoji: msg.emoji || {},
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

  const handleForward = (message) => {
    setForwardMessageData(message);
    setShowForwardModal(true);
    setSelectedConversations([]);
    setSearchQuery("");
    setAdditionalContent("");
    setFilteredConversations(conversations);
  };

  const handleRecall = async (messageId) => {
    try {
      await recallMessage(messageId);
      if (socket) {
        socket.emit("message-recalled", { conversationId: chat._id, messageId });
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: "Tin nhắn đã bị thu hồi", isRevoke: true, fileMeta: [], type: "text", forwardedMessage: null }
            : msg
        )
      );
    } catch (error) {
      console.error("Lỗi thu hồi tin nhắn:", error);
      Alert.alert("Lỗi", error.message || "Không thể thu hồi tin nhắn.");
    }
  };

  const handleHideChat = async () => {
    Alert.alert(
      "Xác nhận ẩn cuộc trò chuyện",
      "Bạn có chắc chắn muốn ẩn cuộc trò chuyện này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Ẩn",
          style: "destructive",
          onPress: async () => {
            try {
              await hideConversation(chat._id);
              if (socket) {
                socket.emit("conversation-hidden", { conversationId: chat._id });
              }
              Alert.alert("Thành công", "Cuộc trò chuyện đã được ẩn.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Lỗi ẩn cuộc trò chuyện:", error);
              Alert.alert("Lỗi", error.message || "Không thể ẩn cuộc trò chuyện.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSelectConversation = (conversationId) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForwardMessage = async () => {
    if (selectedConversations.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một cuộc trò chuyện để chuyển tiếp.");
      return;
    }

    try {
      setIsSending(true);
      const payload = {
        messageId: forwardMessageData._id,
        targetConversationIds: selectedConversations,
        additionalContent: additionalContent.trim(),
      };

      await forwardManyMessage(payload);

      setShowForwardModal(false);
      setSelectedConversations([]);
      setForwardMessageData(null);
      setSearchQuery("");
      setAdditionalContent("");
      setFilteredConversations(conversations);
    } catch (error) {
      console.error("Lỗi chuyển tiếp tin nhắn:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSearchConversations = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((convo) =>
        convo.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
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
      setSelectedFiles([{
        uri,
        name: `recording-${Date.now()}.mp3`,
        type: "audio/mp3",
        size: 0,
      }]);

      setSelectedMedia([]);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error("Lỗi dừng ghi âm:", err);
      Alert.alert("Lỗi", "Không thể dừng ghi âm");
    }
  };

  const playAudio = async (uri) => {
    console.log(uri);
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
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
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
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: "image",
          name: asset.uri.split("/").pop(),
          size: asset.fileSize || 0,
        }));
        setSelectedMedia(selectedImages);
        setSelectedFiles(null);
      }
    } catch (error) {
      console.error("Lỗi chọn hình ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh, vui lòng thử lại.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // hoặc ['application/pdf'] nếu chỉ muốn PDF
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        console.log("User cancelled file picker");
        return;
      }

      const files = result.assets || [result];
      console.log("Picked files:", files);

      // Cập nhật vào state
      setSelectedFiles((prev) => [...prev, ...files]);
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const removeMediaItem = (uriToRemove) => {
    setSelectedMedia((prevMedia) =>
      prevMedia.filter((media) => media.uri !== uriToRemove)
    );
  };
  const removeFileItem = (uri) => {
    setSelectedFiles((prev) => prev.filter((item) => item.uri !== uri));
  };
  const cancelMediaSelection = () => {
    setSelectedMedia([]);
    setSelectedFiles(null);
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


      const response = await fetch(`${"https://be.haudev.io.vn/api"}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // KHÔNG set Content-Type
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
    if (isSendingMessage) {
      console.log("uploadMedia skipped: Already sending");
      return;
    }

    if (!chat?._id || !user?._id) {
      console.error("uploadMedia: Invalid conversationId or userId", {
        chatId: chat._id,
        userId: user._id,
      });
      Alert.alert("Lỗi", "Hội thoại hoặc thông tin người dùng không hợp lệ.");
      return;
    }

    setIsSendingMessage(true);
    setIsSending(true);
    console.log("uploadMedia: Starting media upload");

    try {
      const allFiles = [...(selectedMedia || []), ...(selectedFiles || [])];
      if (!allFiles.length) {
        console.log("uploadMedia: No files to send");
        Alert.alert("Lỗi", "Không có tệp nào để gửi.");
        return;
      }

      console.log("uploadMedia: Uploading files", { fileCount: allFiles.length });
      const fileMeta = await Promise.all(
        allFiles.map(async (file, index) => {
          console.log(`Uploading file ${index + 1}: ${file.name}`);
          const url = await uploadToS3(file);
          let duration = 0;
          if (file?.type?.startsWith("audio")) {
            duration = await getAudioDuration(file.uri);
          }
          return {
            name: file.name,
            size: file.size || 0,
            mimeType: file.type || mime.getType(file.name) || "application/octet-stream",
            duration: duration || undefined,
            url,
          };
        })
      );

      let type = "file";
      if (fileMeta.some((f) => f.mimeType.startsWith("image"))) {
        type = "image";
      } else if (fileMeta.some((f) => f.mimeType.startsWith("audio"))) {
        type = "audio";
      }

      let content = message.trim();
      if (!content) {
        switch (type) {
          case "image":
            content = "Đã gửi hình ảnh";
            break;
          case "audio":
            content = "Đã gửi âm thanh";
            break;
          case "file":
            content = "Đã gửi tài liệu";
            break;
          default:
            content = "Đã gửi tệp";
        }
      }

      const payload = {
        conversationId: chat._id,
        content,
        type,
        fileMeta,
        replyTo: replyingTo?._id || null,
      };

      console.log("uploadMedia: Sending message payload", payload);
      const responseData = await sendMessage(payload);
      console.log("uploadMedia: API response", responseData);

      const newMessage = {
        _id: responseData.data._id,
        content,
        sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
        isCurrentUser: true,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type,
        fileMeta,
        replyTo: replyingTo?._id || null,
        isRevoke: false,
        forwardedMessage: null,
        additionalContent: "",
        emoji: {},
      };

      setMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id)) {
          console.log(`Duplicate message skipped in uploadMedia: ${newMessage._id}`);
          return prev;
        }
        console.log(`Adding message in uploadMedia: ${newMessage._id}`);
        return [...prev, newMessage];
      });

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (socket) {
        console.log("Emitting send-message", { _id: responseData.data._id });
        socket.emit("send-message", {
          conversationId: chat._id,
          _id: responseData.data._id,
          content,
          sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
          createdAt: new Date().toISOString(),
          type,
          fileMeta,
          replyTo: replyingTo?._id || null,
        });
      }

      setMessage("");
      setSelectedMedia([]);
      setSelectedFiles([]);
      setReplyingTo(null);
    } catch (error) {
      console.error("uploadMedia error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể gửi tệp, vui lòng thử lại.",
        [
          { text: "Thử lại", onPress: () => uploadMedia() },
          { text: "Hủy", style: "cancel" },
        ]
      );
    } finally {
      setIsSending(false);
      setIsSendingMessage(false);
    }
  };




  const handleSend = async () => {
    if (isSendingMessage) {
      console.log("handleSend skipped: Already sending");
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage && selectedMedia.length === 0 && selectedFiles.length === 0) {
      console.log("handleSend skipped: No content to send");
      Alert.alert("Thông báo", "Vui lòng nhập nội dung hoặc chọn tệp để gửi.");
      return;
    }

    if (selectedMedia.length > 0 || selectedFiles.length > 0) {
      console.log("handleSend: Delegating to uploadMedia");
      await uploadMedia();
      return;
    }

    if (!chat?._id || !user?._id) {
      console.error("handleSend: Invalid conversationId or userId", {
        chatId: chat._id,
        userId: user._id,
      });
      Alert.alert("Lỗi", "Hội thoại hoặc thông tin người dùng không hợp lệ.");
      return;
    }

    setIsSendingMessage(true);
    setIsSending(true);
    console.log("handleSend: Sending text message", { content: trimmedMessage });

    try {
      const payload = {
        conversationId: chat._id,
        content: trimmedMessage,
        type: "text",
        replyTo: replyingTo?._id || null,
      };

      const responseData = await sendMessage(payload);
      console.log("handleSend: API response", responseData);

      const newMessage = {
        _id: responseData.data._id,
        content: trimmedMessage,
        sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
        isCurrentUser: true,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        fileMeta: [],
        replyTo: replyingTo?._id || null,
        isRevoke: false,
        forwardedMessage: null,
        additionalContent: "",
        emoji: {},
      };

      setMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id)) {
          console.log(`Duplicate message skipped in handleSend: ${newMessage._id}`);
          return prev;
        }
        console.log(`Adding message in handleSend: ${newMessage._id}`);
        return [...prev, newMessage];
      });

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (socket) {
        console.log("Emitting send-message", { _id: responseData.data._id });
        socket.emit("send-message", {
          conversationId: chat._id,
          _id: responseData.data._id,
          content: trimmedMessage,
          sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
          createdAt: new Date().toISOString(),
          type: "text",
          replyTo: replyingTo?._id || null,
        });
      }

      setMessage("");
      setShowEmojiPicker(false);
      setReplyingTo(null);
    } catch (error) {
      console.error("handleSend error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể gửi tin nhắn, vui lòng thử lại.",
        [
          { text: "Thử lại", onPress: () => handleSend() },
          { text: "Hủy", style: "cancel" },
        ]
      );
    } finally {
      setIsSending(false);
      setIsSendingMessage(false);
    }
  };

  const handleSendEmoji = async (messageId, emojiType) => {
    try {
      await sendEmoji(messageId, emojiType);
      if (socket) {
        socket.emit("emoji-updated", { conversationId: chat._id, messageId, emojiType, userId });
      }
    } catch (error) {
      console.error("Lỗi khi gửi cảm xúc:", error);
      Alert.alert("Lỗi", "Không thể gửi cảm xúc.");
    }
  };

  const handleRevokeEmoji = async (messageId, emojiType) => {
    try {
      await revokeEmoji(messageId, emojiType);
      if (socket) {
        socket.emit("emoji-updated", { conversationId: chat._id, messageId, emojiType, userId, revoke: true });
      }
    } catch (error) {
      console.error("Lỗi khi gỡ cảm xúc:", error);
      Alert.alert("Lỗi", "Không thể gỡ cảm xúc.");
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
              if (socket) {
                socket.emit("group:memberLeft", { groupId: chart._id, leftUserId: userId });
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
              if (socket) {
                socket.emit("group:deleted", { groupId: chat._id });
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
      setConversationDetails((prev) => {
        const newDetails = {
          ...prev,
          user: {
            ...prev.user,
            fullName: newGroupName || prev.user.fullName,
            avatar: newGroupAvatar ? newGroupAvatar.uri : prev.user.avatar,
          },
        };
        console.log("Immediate update conversationDetails:", newDetails);
        return newDetails;
      });

      const payload = {};
      if (newGroupName) payload.name = newGroupName;
      if (newGroupAvatar) {
        const url = await uploadToS3(newGroupAvatar);
        payload.avatar = url;
      }

      const updatedGroup = await updateGroupInfo(chat._id, payload.name, payload.avatar);
      console.log("API updateGroupInfo response:", updatedGroup);

      setConversationDetails((prev) => {
        const newDetails = {
          ...prev,
          name: updatedGroup.data.name || prev.name,
          avatar: updatedGroup.data.avatar || prev.avatar,
          user: {
            ...prev.user,
            fullName: updatedGroup.data.name || newGroupName || prev.user.fullName,
            avatar: updatedGroup.data.avatar || payload.avatar || prev.user.avatar,
          },
        };
        console.log("Server update conversationDetails:", newDetails);
        return newDetails;
      });

      setNewGroupName("");
      setNewGroupAvatar(null);
      Alert.alert("Thành công", "Cập nhật thông tin nhóm thành công.");

      if (socket) {
        socket.emit("group:infoUpdated", {
          groupId: chat._id,
          name: payload.name || updatedGroup.data.name,
          avatar: payload.avatar || updatedGroup.data.avatar,
        });
      }
    } catch (error) {
      console.error("Lỗi cập nhật thông tin nhóm:", error);
      setConversationDetails(chat);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật thông tin nhóm.");
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleAddMember = async (friendId) => {
    try {
      await addGroupMember(chat._id, friendId);
      Alert.alert("Thành công", "Thêm thành viên thành công.");
      await fetchMemberInGroupDetails();
      setShowAddMemberModal(false);
      if (socket) {
        socket.emit("group:member-added", { groupId: chat._id, addedUserId: friendId, addedBy: userId });
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
              await fetchMemberInGroupDetails();
              if (socket) {
                socket.emit("group:member-removed", { groupId: chat._id, removedUserId: memberId, removedBy: userId });
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
      await fetchMemberInGroupDetails();
      if (socket) {
        socket.emit("group:memberRoleChanged", { groupId: chat._id, userId: memberId, newRole });
      }
    } catch (error) {
      console.error("Lỗi thay đổi quyền:", error);
      Alert.alert("Lỗi", error.message || "Không thể thay đổi quyền.");
    }
  };

  const handleToggleRequireApproval = async () => {
    try {
      setIsTogglingApproval(true);
      setConversationDetails((prev) => ({
        ...prev,
        requireApproval: !prev.requireApproval,
      }));
      const result = await toggleRequireApproval(chat._id);
      console.log("toggleRequireApproval result:", result);
      setConversationDetails((prev) => ({
        ...prev,
        requireApproval: result.requireApproval,
      }));
      Alert.alert(
        "Thành công",
        `Đã ${result.requireApproval ? "bật" : "tắt"} yêu cầu duyệt thành viên.`
      );
      if (socket) {
        socket.emit("group:requireApprovalChanged", { groupId: chat._id, requireApproval: result.requireApproval });
      }
    } catch (error) {
      console.error("Lỗi bật/tắt yêu cầu duyệt:", error);
      setConversationDetails((prev) => ({
        ...prev,
        requireApproval: !prev.requireApproval,
      }));
      Alert.alert("Lỗi", error.message || "Không thể thay đổi cài đặt duyệt.");
    } finally {
      setIsTogglingApproval(false);
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

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        selectedConversations.includes(item._id) && styles.selectedConversation,
      ]}
      onPress={() => handleSelectConversation(item._id)}
    >
      <Avatar.Image size={40} source={{ uri: item.avatar }} />
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.name}</Text>
        <Text style={styles.conversationType}>{item.type === "group" ? "Nhóm" : "Cá nhân"}</Text>
      </View>
      {selectedConversations.includes(item._id) && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✔</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
            [...new Map(messages.map((msg) => [msg._id, msg])).values()].map((msg) => (
              <MessageItem
                key={msg._id}
                msg={msg}
                user={user}
                userId={userId}
                onReply={handleReply}
                onForward={handleForward}
                onRecall={handleRecall}
                onFocus={focusMessage}
                viewRefs={viewRefs}
                playAudio={playAudio}
                focusedMessageId={focusedMessage}
                onSendEmoji={handleSendEmoji}
                onRevokeEmoji={handleRevokeEmoji}
              />
            ))
          )}
        </ScrollView>
        <ReplyPreview replyingTo={replyingTo} onCancel={cancelReply} />
        <MediaPreview
          selectedMedia={selectedMedia}
          selectedFiles={selectedFiles}
          onRemoveMediaItem={removeMediaItem}
          onRemoveFileItem={removeFileItem}
        />
        <InputBar
          message={message}
          setMessage={setMessage}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          isRecording={isRecording}
          isSending={isSending}
          selectedMedia={selectedMedia}
          selectedFiles={selectedFiles}
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
          onDismiss={() => {
            setShowImagePreview(false);
            if (returnToChatInfo) {
              setShowChatInfoModal(true);
              setReturnToChatInfo(false);
            }
          }}
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
          onHideChat={handleHideChat}
          onOpenImagePreview={(url) => {
            setPreviewImage(url);
            setReturnToChatInfo(true);
            setShowChatInfoModal(false);
            setShowImagePreview(true);
          }}
          isTogglingApproval={isTogglingApproval}
        />
        <Modal
          visible={showForwardModal}
          animationType="slide"
          onRequestClose={() => {
            setShowForwardModal(false);
            setSearchQuery("");
            setAdditionalContent("");
            setFilteredConversations(conversations);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowForwardModal(false);
                setSearchQuery("");
                setAdditionalContent("");
                setFilteredConversations(conversations);
              }}>
                <Text style={styles.cancelButton}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleForwardMessage}
                disabled={isSending || selectedConversations.length === 0}
              >
                <Text style={[
                  styles.forwardButtonText,
                  (isSending || selectedConversations.length === 0) && styles.disabledButtonText,
                ]}>
                  Chuyển tiếp
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.additionalContentContainer}>
              <TextInput
                style={styles.additionalContentInput}
                placeholder="Nhập nội dung bổ sung (tuỳ chọn)..."
                value={additionalContent}
                onChangeText={setAdditionalContent}
                multiline
              />
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChangeText={handleSearchConversations}
              />
            </View>
            {filteredConversations.length === 0 ? (
              <Text style={styles.noResults}>Không tìm thấy cuộc trò chuyện nào.</Text>
            ) : (
              <FlatList
                data={filteredConversations}
                renderItem={renderConversationItem}
                keyExtractor={(item) => item._id}
                style={styles.conversationList}
              />
            )}
          </View>
        </Modal>
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
  modalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  cancelButton: { fontSize: 16, color: '#007AFF' },
  forwardButtonText: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' },
  disabledButtonText: { color: '#aaa' },
  additionalContentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  additionalContentInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  conversationList: { flex: 1 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedConversation: { backgroundColor: '#e6f3ff' },
  conversationInfo: { marginLeft: 12, flex: 1 },
  conversationName: { fontSize: 16, fontWeight: '500' },
  conversationType: { fontSize: 14, color: '#666' },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: { color: '#fff', fontSize: 16 },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});

export default ChatScreen;
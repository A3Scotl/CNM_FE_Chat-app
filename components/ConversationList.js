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

  const sortConversations = (convoList) => {
    return convoList.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const bTime = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return bTime - aTime;
    });
  };

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
          return {
            _id: convo._id,
            user: {
              fullName: convo.name,
              avatar: convo.avatar || "https://i.pravatar.cc/150",
            },
            lastMessage: convo.lastMessage || null,
            type: "group",
            unreadCount: convo.unreadCount || 0,
            participants: convo.participants || [],
            requireApproval: convo.requireApproval,
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

      const sortedConversations = sortConversations(mappedConversations);
      setConversations(sortedConversations);
    } catch (error) {
      console.error("❌ Lỗi khi tải cuộc trò chuyện:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách cuộc trò chuyện.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let socketConnection;

    const setupSocket = async () => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        console.warn(
          "Token hoặc userId không tồn tại, không thể kết nối socket"
        );
        return;
      }

      socketConnection = io("https://be.haudev.io.vn", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket kết nối thành công trong ConversationList");
        socketConnection.emit("register", userId);
      });

      socketConnection.on(
        "newConversation",
        ({ conversationId, participants }) => {
          console.log("Nhận sự kiện newConversation:", {
            conversationId,
            participants,
          });
          fetchConversations();
        }
      );

      socketConnection.on("groupCreated", ({ group, message }) => {
        try {
          Audio.Sound.createAsync(
            require("../assets/sounds/invite-group.mp3")
          ).then(({ sound }) => {
            sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) sound.unloadAsync();
            });
          });
          // Alert.alert("Nhóm mới", `Nhóm "${group.name}" đã được tạo.`);
          fetchConversations();
        } catch (err) {
          console.error("Lỗi phát âm thanh nhóm mới:", err);
        }
      });

      socketConnection.on("new-message", (msg) => {
        setConversations((prev) => {
          const updatedConversations = prev.map((convo) => {
            if (convo._id === msg.conversationId) {
              const isCurrentUser = String(msg.sender._id) === String(userId);
              return {
                ...convo,
                lastMessage: {
                  _id: msg._id,
                  content: msg.content,
                  sender: msg.sender,
                  createdAt: msg.createdAt,
                  type: msg.type,
                  fileMeta: msg.fileMeta || [],
                  replyTo: msg.replyTo,
                  isRevoke: msg.isRevoke || false,
                },
                unreadCount: isCurrentUser
                  ? convo.unreadCount
                  : (convo.unreadCount || 0) + 1,
              };
            }
            return convo;
          });

          return sortConversations([...updatedConversations]);
        });
      });

      socketConnection.on(
        "message-recalled",
        ({ conversationId, messageId, updatedMessage }) => {
          setConversations((prev) => {
            const updatedConversations = prev.map((convo) => {
              if (
                convo._id === conversationId &&
                convo.lastMessage?._id === messageId
              ) {
                return {
                  ...convo,
                  lastMessage: {
                    ...convo.lastMessage,
                    content: updatedMessage.content,
                    isRevoke: true,
                    fileMeta: [],
                    type: "text",
                  },
                };
              }
              return convo;
            });

            return sortConversations([...updatedConversations]);
          });
        }
      );

      socketConnection.on("conversation-hidden", ({ conversationId }) => {
        setConversations((prev) => {
          const updatedConversations = prev.filter(
            (convo) => convo._id !== conversationId
          );
          return sortConversations([...updatedConversations]);
        });
      });

      socketConnection.on(
        "group:member-added",
        ({ groupId, addedUserId, addedBy }) => {
          fetchConversations();
          if (addedBy !== userId) {
            try {
              Audio.Sound.createAsync(
                require("../assets/sounds/invite-group.mp3")
              ).then(({ sound }) => {
                sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.didJustFinish) sound.unloadAsync();
                });
              });
              // Alert.alert("Thành viên mới", `Một người dùng đã được thêm vào nhóm.`);
            } catch (err) {
              console.error("Lỗi phát âm thanh thông báo:", err);
            }
          }
        }
      );

      socketConnection.on(
        "group:member-removed",
        ({ groupId, removedUserId, removedBy }) => {
          fetchConversations();
          if (removedBy !== userId && removedUserId !== userId) {
            try {
              Audio.Sound.createAsync(
                require("../assets/sounds/invite-group.mp3")
              ).then(({ sound }) => {
                sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.didJustFinish) sound.unloadAsync();
                });
              });
              // Alert.alert("Thành viên bị xóa", `Một người dùng đã bị xóa khỏi nhóm.`);
            } catch (err) {
              console.error("Lỗi phát âm thanh thông báo:", err);
            }
          }
        }
      );

      socketConnection.on("group:memberLeft", ({ groupId, leftUserId }) => {
        fetchConversations();
        if (leftUserId !== userId) {
          try {
            Audio.Sound.createAsync(
              require("../assets/sounds/invite-group.mp3")
            ).then(({ sound }) => {
              sound.playAsync();
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) sound.unloadAsync();
              });
            });
            // Alert.alert(
            //   "Thành viên rời nhóm",
            //   `Một thành viên đã rời khỏi nhóm.`
            // );
          } catch (err) {
            console.error("Lỗi phát âm thanh thông báo:", err);
          }
        }
      });

      socketConnection.on("group:deleted", ({ groupId }) => {
        setConversations((prev) => {
          const updatedConversations = prev.filter(
            (convo) => convo._id !== groupId
          );
          return sortConversations([...updatedConversations]);
        });
        try {
          Audio.Sound.createAsync(
            require("../assets/sounds/invite-group.mp3")
          ).then(({ sound }) => {
            sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) sound.unloadAsync();
            });
          });
          // Alert.alert("Nhóm đã giải tán", `Nhóm đã bị giải tán.`);
        } catch (err) {
          console.error("Lỗi phát âm thanh thông báo:", err);
        }
      });

      socketConnection.on("group:infoUpdated", ({ groupId, name, avatar }) => {
        setConversations((prev) => {
          const updatedConversations = prev.map((convo) => {
            if (convo._id === groupId) {
              return {
                ...convo,
                user: {
                  ...convo.user,
                  fullName: name || convo.user.fullName,
                  avatar: avatar || convo.user.avatar,
                },
              };
            }
            return convo;
          });
          return sortConversations([...updatedConversations]);
        });
        try {
          Audio.Sound.createAsync(
            require("../assets/sounds/invite-group.mp3")
          ).then(({ sound }) => {
            sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) sound.unloadAsync();
            });
          });
          // Alert.alert("Cập nhật nhóm", `Thông tin nhóm đã được cập nhật.`);
        } catch (err) {
          console.error("Lỗi phát âm thanh thông báo:", err);
        }
      });

      socketConnection.on(
        "group:memberRoleChanged",
        ({ groupId, userId: affectedUserId, newRole }) => {
          fetchConversations();
          if (affectedUserId !== userId) {
            const roleText =
              newRole === "owner"
                ? "chủ nhóm"
                : newRole === "admin"
                ? "quản trị viên"
                : "thành viên";
            try {
              Audio.Sound.createAsync(
                require("../assets/sounds/invite-group.mp3")
              ).then(({ sound }) => {
                sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.didJustFinish) sound.unloadAsync();
                });
              });
              // Alert.alert("Thay đổi quyền", `Quyền của một thành viên đã được thay đổi thành ${roleText}.`);
            } catch (err) {
              console.error("Lỗi phát âm thanh thông báo:", err);
            }
          }
        }
      );

      socketConnection.on(
        "group:requireApprovalChanged",
        ({ groupId, requireApproval }) => {
          setConversations((prev) => {
            const updatedConversations = prev.map((convo) => {
              if (convo._id === groupId) {
                return {
                  ...convo,
                  requireApproval,
                };
              }
              return convo;
            });
            return sortConversations([...updatedConversations]);
          });
          try {
            Audio.Sound.createAsync(
              require("../assets/sounds/invite-group.mp3")
            ).then(({ sound }) => {
              sound.playAsync();
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) sound.unloadAsync();
              });
            });
            Alert.alert(
              "Cập nhật nhóm",
              `Yêu cầu duyệt thành viên đã được ${
                requireApproval ? "bật" : "tắt"
              }.`
            );
          } catch (err) {
            console.error("Lỗi phát âm thanh thông báo:", err);
          }
        }
      );

      socketConnection.on("disconnect", (reason) => {
        console.log(
          "Ngắt kết nối Socket.IO trong ConversationList. Lý do:",
          reason
        );
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
      sortConversations(
        prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
      )
    );
    // console.log(chat);
    navigation.navigate("Chat", {
      conversationId: chat._id,
      chat: chat,
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
        <View
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#007bff" />
        </View>
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

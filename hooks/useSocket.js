import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { Alert } from "react-native";
import { SOCKET_URL } from "@env";

export const useSocket = (
  userId,
  {
    onFriendRequest,
    onFriendRequestAccepted,
    onNewMessage,
    onTyping,
    onStopTyping,
    onNewGroupInvite,
    onGroupInviteAccepted,
    onMemberAdded,
    onMemberRemoved,
    onUserJoinedGroup,
  } = {}
) => {
  const socketRef = useRef(null);
  const eventCache = useRef(new Map()); // Cache để lọc sự kiện trùng lặp

  useEffect(() => {
    if (!userId) {
      console.warn("useSocket: userId không tồn tại");
      return;
    }

    const initializeSocket = async () => {
      if (socketRef.current) {
        console.log("Socket đã tồn tại, bỏ qua khởi tạo mới");
        return;
      }

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.warn("useSocket: Token không tồn tại");
          return;
        }

        socketRef.current = io(SOCKET_URL || "https://be.haudev.io.vn", {
          auth: { userId, token },
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000,
          timeout: 40000,
        });

        socketRef.current.on("connect", () => {
          console.log("✅ Socket kết nối thành công");
          socketRef.current.emit("register", userId);
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("Lỗi kết nối socket:", {
            message: err.message,
            description: err.description,
            context: err.context,
          });
          Alert.alert("Lỗi kết nối", "Không thể kết nối đến máy chủ.");
        });

        socketRef.current.on(
          "friend-request",
          ({ message, from, requestId }) => {
            console.log("Nhận yêu cầu kết bạn:", { message, from, requestId });
            Alert.alert(
              "Yêu cầu kết bạn mới",
              `${message} từ ${from.fullName}`
            );
            if (onFriendRequest) {
              onFriendRequest({ message, from, requestId });
            }
          }
        );

        socketRef.current.on("friend-request-accepted", ({ message, user }) => {
          console.log("Yêu cầu kết bạn đã được chấp nhận:", { message, user });
          Alert.alert("Yêu cầu kết bạn đã được chấp nhận", message);
          if (onFriendRequestAccepted) {
            onFriendRequestAccepted({ message, user });
          }
        });

        socketRef.current.on("new-message", (msg) => {
          if (!msg._id || !msg.conversationId) {
            console.warn("Tin nhắn không hợp lệ từ socket:", msg);
            return;
          }
          if (onNewMessage) {
            onNewMessage(msg);
          }
        });

        socketRef.current.on(
          "typing",
          ({ conversationId, userId: typingUserId, fullName }) => {
            if (onTyping && conversationId && typingUserId && fullName) {
              onTyping({ conversationId, userId: typingUserId, fullName });
            }
          }
        );

        socketRef.current.on(
          "stop-typing",
          ({ conversationId, userId: typingUserId }) => {
            if (onStopTyping && conversationId && typingUserId) {
              onStopTyping({ conversationId, userId: typingUserId });
            }
          }
        );

        socketRef.current.on("new-group-invite", (invite) => {
          console.log("📨 Nhận lời mời nhóm:", invite);
          if (onNewGroupInvite) onNewGroupInvite(invite);
        });

        socketRef.current.on("group-invite-accepted", ({ user, groupId }) => {
          console.log("✅ Ai đó đã tham gia nhóm:", user, groupId);
          if (onGroupInviteAccepted) onGroupInviteAccepted({ user, groupId });
        });

        const handleMemberAdded = (
          { groupId, addedUserIds, addedBy },
          eventName
        ) => {
          if (!groupId || !Array.isArray(addedUserIds)) {
            console.warn(`Payload ${eventName} không hợp lệ:`, {
              groupId,
              addedUserIds,
              addedBy,
            });
            return;
          }

          // Tạo key duy nhất cho sự kiện dựa trên groupId và addedUserIds
          const eventKey = `${groupId}:${addedUserIds.sort().join(",")}`;
          const now = Date.now();
          const cachedEvent = eventCache.current.get(eventKey);

          // Chỉ xử lý nếu sự kiện chưa được xử lý trong 5 giây qua
          if (!cachedEvent || now - cachedEvent.timestamp > 5000) {
            console.log(`📨 Thành viên mới được thêm (${eventName}):`, {
              groupId,
              addedUserIds,
              addedBy,
            });
            eventCache.current.set(eventKey, { timestamp: now });
            if (onMemberAdded) {
              onMemberAdded({ groupId, addedUserIds, addedBy });
            }

            // Xóa cache sau 10 giây để tránh tràn bộ nhớ
            setTimeout(() => {
              eventCache.current.delete(eventKey);
            }, 10000);
          } else {
            console.log(`Bỏ qua sự kiện trùng lặp (${eventName}):`, eventKey);
          }
        };

        socketRef.current.on("user-joined-group", ({ groupId, user }) => {
          console.log("📨 Người dùng tham gia nhóm:", { groupId, user });
          if (onUserJoinedGroup) {
            onUserJoinedGroup({ groupId, user });
          }
        });

        socketRef.current.on("group:member-added", (payload) => {
          handleMemberAdded(payload, "group:member-added");
        });

        socketRef.current.on("group:member-added-group", (payload) => {
          handleMemberAdded(payload, "group:member-added-group");
        });

        socketRef.current.on(
          "group:member-removed",
          ({ groupId, removedUserId, removedBy }) => {
            if (!groupId || !removedUserId) {
              console.warn("Payload group:member-removed không hợp lệ:", {
                groupId,
                removedUserId,
                removedBy,
              });
              return;
            }
            console.log("📨 Thành viên bị xóa:", {
              groupId,
              removedUserId,
              removedBy,
            });
            if (onMemberRemoved) {
              onMemberRemoved({ groupId, userId: removedUserId });
            }
          }
        );

        socketRef.current.on("disconnect", (reason) => {
          console.log("Ngắt kết nối", `Lý do: ${reason}`);
        });

        socketRef.current.onAny((event, ...args) => {
          console.log(`Sự kiện socket: ${event}`, args);
        });
      } catch (err) {
        console.error("Lỗi khi khởi tạo socket:", err);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("user-joined-group");
        socketRef.current.off("friend-request");
        socketRef.current.off("friend-request-accepted");
        socketRef.current.off("new-message");
        socketRef.current.off("typing");
        socketRef.current.off("stop-typing");
        socketRef.current.off("new-group-invite");
        socketRef.current.off("group-invite-accepted");
        socketRef.current.off("group:member-added");
        socketRef.current.off("group:member-added-group");
        socketRef.current.off("group:member-removed");
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("disconnect");
        socketRef.current.offAny();
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("🧹 Socket đã được cleanup");
      }
    };
  }, [
    userId,
    onFriendRequest,
    onFriendRequestAccepted,
    onNewMessage,
    onTyping,
    onStopTyping,
    onNewGroupInvite,
    onGroupInviteAccepted,
    onMemberAdded,
    onMemberRemoved,
    onUserJoinedGroup,
  ]);

  const joinRoom = (conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("join-room", conversationId);
      console.log(`Đã tham gia phòng: ${conversationId}`);
    }
  };

  const emitTyping = (conversationId, userId) => {
    if (socketRef.current && conversationId && userId) {
      socketRef.current.emit("typing", conversationId, userId);
    }
  };

  const emitStopTyping = (conversationId, userId) => {
    if (socketRef.current && conversationId && userId) {
      socketRef.current.emit("stop-typing", conversationId, userId);
    }
  };

  const emitGroupInvite = (toUserId, invite) => {
    if (socketRef.current) {
      socketRef.current.emit("send-group-invite", { toUserId, invite });
    }
  };

  const emitGroupInviteAccepted = (groupId, user) => {
    if (socketRef.current) {
      socketRef.current.emit("accept-group-invite", { groupId, user });
    }
  };

  return {
    socket: socketRef.current,
    joinRoom,
    emitTyping,
    emitStopTyping,
    emitGroupInvite,
    emitGroupInviteAccepted,
  };
};

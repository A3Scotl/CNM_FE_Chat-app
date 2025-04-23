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
  } = {}
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const initializeSocket = async () => {
      if (socketRef.current) {
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
        socketRef.current.disconnect();
        socketRef.current = null;
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
      socketRef.current.emit("accept-group-invite", {
        groupId,
        user,
      });
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

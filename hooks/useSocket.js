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

        socketRef.current = io(SOCKET_URL, {
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

        socketRef.current.on(
          "friend-request",
          ({ message, from, requestId }) => {
            console.log("Nhận yêu cầu kết bạn:", { message, from, requestId });
            // Alert.alert("Yêu cầu kết bạn mới", `${message} từ ${from.fullName}`);
            // if (onFriendRequest) {
            //   onFriendRequest({ message, from, requestId });
            // }
          }
        );

        socketRef.current.on("friend-request-accepted", ({ message, user }) => {
          console.log("Yêu cầu kết bạn đã được chấp nhận:", { message, user });
          // Alert.alert("Yêu cầu kết bạn đã được chấp nhận", message);
          // if (onFriendRequestAccepted) {
          //   onFriendRequestAccepted({ message, user });
          // }
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

        if (onNewGroupInvite) {
          socket.on("new-group-invite", (data) => {
            onNewGroupInvite(data);
          });
        }

        if (onGroupInviteAccepted) {
          socket.on("group-invite-accepted", (data) => {
            onGroupInviteAccepted(data);
          });
        }

        if (onGroupInviteRejected) {
          socket.on("group-invite-rejected", (data) => {
            onGroupInviteRejected(data);
          });
        }

        socketRef.current.on(
          "require-approval-toggled",
          ({ groupId, requireApproval, message }) => {
            console.log("Trạng thái duyệt thành viên thay đổi:", {
              groupId,
              requireApproval,
              message,
            });
            if (onRequireApprovalToggled) {
              onRequireApprovalToggled({ groupId, requireApproval, message });
            }
          }
        );

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
    onGroupInviteRejected,
    onRequireApprovalToggled,
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

  return { socket: socketRef.current, joinRoom, emitTyping, emitStopTyping };
};

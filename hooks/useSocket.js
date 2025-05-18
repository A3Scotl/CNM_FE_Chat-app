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
    onUpdateChatList,
  } = {}
) => {
  const socketRef = useRef(null);
  const eventCache = useRef(new Map());
  const isCleaningUp = useRef(false);
  const isConnected = useRef(false); // Track stable connection
  const messageQueue = useRef([]); // Queue for buffering events during reconnection

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
          isConnected.current = true;
          socketRef.current.emit("register", userId);
          // Process queued messages
          while (messageQueue.current.length > 0) {
            const { event, data } = messageQueue.current.shift();
            processEvent(event, data);
          }
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("Lỗi kết nối socket:", {
            message: err.message,
            description: err.description,
            context: err.context,
          });
          isConnected.current = false;
          Alert.alert("Lỗi kết nối", "Không thể kết nối đến máy chủ.");
        });

        const processEvent = (event, data) => {
          if (isCleaningUp.current || !isConnected.current) {
            console.log(
              `Hàng đợi sự kiện ${event} do đang cleanup hoặc chưa kết nối`
            );
            messageQueue.current.push({ event, data });
            return;
          }

          switch (event) {
            case "friend-request":
              const { message, from, requestId } = data;
              const friendRequestKey = `friend-request:${requestId}:${from._id}`;
              if (checkCache(friendRequestKey, "yêu cầu kết bạn")) {
                Alert.alert(
                  "Yêu cầu kết bạn mới",
                  `${message} từ ${from.fullName}`
                );
                if (onFriendRequest)
                  onFriendRequest({ message, from, requestId });
              }
              break;

            case "friend-request-accepted":
              const { message: msg, user } = data;
              const friendAcceptedKey = `friend-request-accepted:${user._id}`;
              if (checkCache(friendAcceptedKey, "yêu cầu kết bạn chấp nhận")) {
                Alert.alert("Yêu cầu kết bạn đã được chấp nhận", msg);
                if (onFriendRequestAccepted)
                  onFriendRequestAccepted({ message: msg, user });
              }
              break;

            case "new-message":
              if (!data._id || !data.conversationId) {
                console.warn("Tin nhắn không hợp lệ từ socket:", data);
                return;
              }
              const messageKey = `new-message:${data._id}:${
                data.conversationId
              }:${data.createdAt || Date.now()}`;
              if (checkCache(messageKey, "tin nhắn mới")) {
                console.log("Xử lý tin nhắn mới:", data);
                if (onNewMessage) onNewMessage(data);
              }
              break;

            case "typing":
              const { conversationId, userId: typingUserId, fullName } = data;
              const typingKey = `typing:${conversationId}:${typingUserId}`;
              if (checkCache(typingKey, "typing")) {
                if (onTyping && conversationId && typingUserId && fullName) {
                  onTyping({ conversationId, userId: typingUserId, fullName });
                }
              }
              break;

            case "stop-typing":
              const { conversationId: stopConvoId, userId: stopUserId } = data;
              const stopTypingKey = `stop-typing:${stopConvoId}:${stopUserId}`;
              if (checkCache(stopTypingKey, "stop-typing")) {
                if (onStopTyping && stopConvoId && stopUserId) {
                  onStopTyping({
                    conversationId: stopConvoId,
                    userId: stopUserId,
                  });
                }
              }
              break;

            case "new-group-invite":
              const inviteKey = `new-group-invite:${data._id}`;
              if (checkCache(inviteKey, "lời mời nhóm")) {
                console.log("📨 Nhận lời mời nhóm:", data);
                if (onNewGroupInvite) onNewGroupInvite(data);
              }
              break;

            case "group-invite-accepted":
              const { user: inviteUser, groupId } = data;
              const groupInviteKey = `group-invite-accepted:${groupId}:${inviteUser._id}`;
              if (checkCache(groupInviteKey, "nhóm chấp nhận")) {
                console.log("✅ Ai đó đã tham gia nhóm:", inviteUser, groupId);
                if (onGroupInviteAccepted)
                  onGroupInviteAccepted({ user: inviteUser, groupId });
              }
              break;

            case "update-chat-list":
              const chatKey = `update-chat-list:${data.conversationId}:${
                data.updatedAt || Date.now()
              }`;
              if (checkCache(chatKey, "cập nhật danh sách chat")) {
                console.log("📨 Cập nhật danh sách chat:", data);
                if (onUpdateChatList) onUpdateChatList(data);
              }
              break;

            case "user-joined-group":
              const { groupId: joinGroupId, user: joinUser } = data;
              const joinKey = `user-joined-group:${joinGroupId}:${joinUser._id}`;
              if (checkCache(joinKey, "người dùng tham gia nhóm")) {
                console.log("📨 Người dùng tham gia nhóm:", {
                  groupId: joinGroupId,
                  user: joinUser,
                });
                if (onUserJoinedGroup)
                  onUserJoinedGroup({ groupId: joinGroupId, user: joinUser });
              }
              break;

            case "group:member-added":
            case "group:member-added-group":
              const { groupId: memberGroupId, addedUserIds, addedBy } = data;
              if (!groupId || !Array.isArray(addedUserIds)) {
                console.warn(`Payload ${event} không hợp lệ:`, {
                  groupId,
                  addedUserIds,
                  addedBy,
                });
                return;
              }
              const memberAddedKey = `${event}:${groupId}:${addedUserIds
                .sort()
                .join(",")}`;
              if (checkCache(memberAddedKey, `thành viên mới (${event})`)) {
                console.log(`📨 Thành viên mới được thêm (${event}):`, {
                  groupId,
                  addedUserIds,
                  addedBy,
                });
                if (onMemberAdded)
                  onMemberAdded({ groupId, addedUserIds, addedBy });
              }
              break;

            case "group:member-removed":
              const { groupId: removeGroupId, removedUserId, removedBy } = data;
              if (!removeGroupId || !removedUserId) {
                console.warn("Payload group:member-removed không hợp lệ:", {
                  groupId: removeGroupId,
                  removedUserId,
                  removedBy,
                });
                return;
              }
              const memberRemovedKey = `group:member-removed:${removeGroupId}:${removedUserId}`;
              if (checkCache(memberRemovedKey, "thành viên bị xóa")) {
                console.log("📨 Thành viên bị xóa:", {
                  groupId: removeGroupId,
                  removedUserId,
                  removedBy,
                });
                if (onMemberRemoved)
                  onMemberRemoved({
                    groupId: removeGroupId,
                    userId: removedUserId,
                  });
              }
              break;

            default:
              console.log(`Sự kiện socket không xử lý: ${event}`, data);
          }
        };

        const checkCache = (eventKey, eventName) => {
          const now = Date.now();
          const cachedEvent = eventCache.current.get(eventKey);
          if (cachedEvent && now - cachedEvent.timestamp < 3000) {
            // Tightened to 3 seconds
            console.log(`Bỏ qua sự kiện trùng lặp (${eventName}):`, eventKey);
            return false;
          }
          eventCache.current.set(eventKey, { timestamp: now });
          setTimeout(() => {
            eventCache.current.delete(eventKey);
          }, 10000);
          return true;
        };

        socketRef.current.on("friend-request", (data) =>
          processEvent("friend-request", data)
        );
        socketRef.current.on("friend-request-accepted", (data) =>
          processEvent("friend-request-accepted", data)
        );
        socketRef.current.on("new-message", (data) =>
          processEvent("new-message", data)
        );
        socketRef.current.on("typing", (data) => processEvent("typing", data));
        socketRef.current.on("stop-typing", (data) =>
          processEvent("stop-typing", data)
        );
        socketRef.current.on("new-group-invite", (data) =>
          processEvent("new-group-invite", data)
        );
        socketRef.current.on("group-invite-accepted", (data) =>
          processEvent("group-invite-accepted", data)
        );
        socketRef.current.on("update-chat-list", (data) =>
          processEvent("update-chat-list", data)
        );
        socketRef.current.on("user-joined-group", (data) =>
          processEvent("user-joined-group", data)
        );
        socketRef.current.on("group:member-added", (data) =>
          processEvent("group:member-added", data)
        );
        socketRef.current.on("group:member-added-group", (data) =>
          processEvent("group:member-added-group", data)
        );
        socketRef.current.on("group:member-removed", (data) =>
          processEvent("group:member-removed", data)
        );

        socketRef.current.on("disconnect", (reason) => {
          console.log("Ngắt kết nối", `Lý do: ${reason}`);
          isConnected.current = false;
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
      isCleaningUp.current = true;
      if (socketRef.current) {
        socketRef.current.off("friend-request");
        socketRef.current.off("friend-request-accepted");
        socketRef.current.off("new-message");
        socketRef.current.off("typing");
        socketRef.current.off("stop-typing");
        socketRef.current.off("new-group-invite");
        socketRef.current.off("group-invite-accepted");
        socketRef.current.off("update-chat-list");
        socketRef.current.off("user-joined-group");
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
      isCleaningUp.current = false;
      messageQueue.current = []; // Clear queue on cleanup
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
    onUpdateChatList,
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

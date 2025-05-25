import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  getPendingGroupInvites,
  sendGroupInvite,
  acceptGroupInvite,
  rejectGroupInvite,
} from "../apis/pendingGroupInvite.api";
import { getFriendsNotInGroup } from "../apis/conversationGroup.api";

export const useGroupInvite = (userId, chatId, socket) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Fetch pending group invites
  const fetchPendingInvites = useCallback(async () => {
    if (!chatId) return;
    setLoadingInvites(true);
    try {
      const invites = await getPendingGroupInvites(chatId); // Truyền chatId (groupId)
      setPendingInvites(invites.data || []);
    } catch (error) {
      // Alert.alert("Lỗi", "Không thể tải danh sách lời mời.");
    } finally {
      setLoadingInvites(false);
    }
  }, [chatId]);

  // Fetch friends not in the group
  const fetchAvailableFriends = useCallback(async () => {
    if (!chatId) return;
    setLoadingFriends(true);
    try {
      const friends = await getFriendsNotInGroup(chatId);
      setAvailableFriends(friends.data || []);
      setFriendsLoaded(true);
    } catch (error) {
      // Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    } finally {
      setLoadingFriends(false);
    }
  }, [chatId]);

  // Send group invite
  const handleSendInvite = useCallback(
    async (invitedUserId) => {
      if (!chatId || !invitedUserId) return;
      try {
        const response = await sendGroupInvite(chatId, invitedUserId);
        const inviteId = response._id || `temp-${Date.now()}-${invitedUserId}`;
        if (socket?.connected) {
          socket.emit("new-group-invite", {
            groupId: chatId,
            invitedUser: invitedUserId,
            invitedBy: userId,
            inviteId,
          });
        }
        Alert.alert("Thành công", "Đã gửi lời mời tham gia nhóm.");
        return inviteId;
      } catch (error) {
        Alert.alert("Lỗi", "Không thể gửi lời mời tham gia nhóm.");
        throw error;
      }
    },
    [chatId, userId, socket]
  );

  // Accept group invite
  const handleAcceptInvite = useCallback(
    async (inviteId) => {
      try {
        await acceptGroupInvite(inviteId);
        setPendingInvites((prev) =>
          prev.filter((invite) => invite._id !== inviteId)
        );
        const invite = pendingInvites.find((inv) => inv._id === inviteId);
        if (socket?.connected && invite) {
          socket.emit("group-invite-accepted", {
            groupId: chatId,
            userId: invite.invitedUser._id,
            inviteId,
          });
        }
        Alert.alert("Thành công", "Đã chấp nhận lời mời nhóm.");
      } catch (error) {
        Alert.alert("Lỗi", "Không thể chấp nhận lời mời nhóm.");
      }
    },
    [chatId, socket, pendingInvites]
  );

  // Reject group invite
  const handleRejectInvite = useCallback(
    async (inviteId) => {
      try {
        await rejectGroupInvite(inviteId);
        setPendingInvites((prev) =>
          prev.filter((invite) => invite._id !== inviteId)
        );
        const invite = pendingInvites.find((inv) => inv._id === inviteId);
        if (socket?.connected && invite) {
          socket.emit("group-invite-rejected", {
            groupId: chatId,
            userId: invite.invitedUser._id,
            inviteId,
          });
        }
        Alert.alert("Thành công", "Đã từ chối lời mời nhóm.");
      } catch (error) {
        Alert.alert("Lỗi", "Không thể từ chối lời mời nhóm.");
      }
    },
    [chatId, socket, pendingInvites]
  );

  // Socket event listeners
  useEffect(() => {
    if (!socket?.connected || !chatId) return;

    const handleNewGroupInvite = ({
      groupId,
      invitedUser,
      invitedBy,
      inviteId,
    }) => {
      if (groupId === chatId) {
        setPendingInvites((prev) => [
          ...prev,
          {
            _id: inviteId,
            groupId,
            invitedUser: {
              _id: invitedUser,
              fullName: "Unknown",
              avatar: "https://i.pravatar.cc/150",
            },
            invitedBy,
            status: "pending",
          },
        ]);
        Alert.alert(
          "Lời mời mới",
          `Có lời mời nhóm mới từ người dùng ${invitedBy}.`
        );
      }
    };

    const handleGroupInviteAccepted = ({ groupId, userId, inviteId }) => {
      if (groupId === chatId) {
        setPendingInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
      }
    };

    const handleGroupInviteRejected = ({ groupId, userId, inviteId }) => {
      if (groupId === chatId) {
        setPendingInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
      }
    };

    socket.on("new-group-invite", handleNewGroupInvite);
    socket.on("group-invite-accepted", handleGroupInviteAccepted);
    socket.on("group-invite-rejected", handleGroupInviteRejected);

    return () => {
      socket.off("new-group-invite", handleNewGroupInvite);
      socket.off("group-invite-accepted", handleGroupInviteAccepted);
      socket.off("group-invite-rejected", handleGroupInviteRejected);
    };
  }, [socket, chatId]);

  // Fetch invites when chatId changes
  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  return {
    pendingInvites,
    availableFriends,
    friendsLoaded,
    loadingInvites,
    loadingFriends,
    fetchPendingInvites,
    fetchAvailableFriends,
    handleSendInvite,
    handleAcceptInvite,
    handleRejectInvite,
  };
};

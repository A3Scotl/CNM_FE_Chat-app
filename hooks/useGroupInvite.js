import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  getPendingGroupInvitesByGroup,
  sendGroupInvite,
  acceptGroupInvite,
  rejectGroupInvite,
} from "../apis/pendingGroupInvite.api";
import { getFriendsNotInGroup } from "../apis/conversationGroup.api";

export const useGroupInvite = (
  userId,
  chatId,
  socket,
  fetchMemberInGroupDetails
) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Fetch pending group invites
  const fetchPendingInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const response = await getPendingGroupInvitesByGroup(chatId);
      console.log("fetchPendingInvites response:", response); // Debug log
      // Ensure response is an array
      const invites = Array.isArray(response) ? response : response?.data || [];
      setPendingInvites(
        invites.filter((invite) => invite.status === "pending")
      );
    } catch (error) {
      console.error("Lỗi lấy lời mời nhóm:", error);
      setPendingInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  }, [chatId]);

  // Fetch friends not in the group
  const fetchAvailableFriends = useCallback(async () => {
    if (!chatId) return;
    setLoadingFriends(true);
    try {
      const response = await getFriendsNotInGroup(chatId);
      console.log("fetchAvailableFriends response:", response); // Debug log
      setAvailableFriends(Array.isArray(response?.data) ? response.data : []);
      setFriendsLoaded(true);
    } catch (error) {
      console.error("Lỗi tải danh sách bạn bè:", error);
      // Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    } finally {
      setLoadingFriends(false);
    }
  }, [chatId]);

  // Send group invite
  const handleSendInvite = useCallback(
    async (invitedUserId) => {
      if (!chatId || !invitedUserId || !userId) {
        Alert.alert("Lỗi", "Thiếu thông tin nhóm, người dùng hoặc người mời.");
        return;
      }

      try {
        const response = await sendGroupInvite(chatId, invitedUserId, userId);
        const inviteId = response._id || `temp-${Date.now()}-${invitedUserId}`;
        const friend = availableFriends.find((f) => f._id === invitedUserId);
        setPendingInvites((prev) => [
          ...prev,
          {
            _id: inviteId,
            groupId: chatId,
            invitedUser: {
              _id: invitedUserId,
              fullName: friend?.fullName || "Unknown",
              avatar: friend?.avatar || "https://i.pravatar.cc/150",
            },
            invitedBy: userId,
            status: "pending",
          },
        ]);
        if (socket?.connected) {
          socket.emit("new-group-invite", {
            groupId: chatId,
            invitedUser: invitedUserId,
            invitedBy: userId,
            inviteId,
          });
        }
        Alert.alert("Thành công", "Đã gửi lời mời tham gia nhóm.");
        await fetchPendingInvites(); // Tải lại từ server để đồng bộ
        return inviteId;
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message ||
          "Không thể gửi lời mời tham gia nhóm.";
        Alert.alert("Lỗi", errorMessage);
        throw error;
      }
    },
    [chatId, userId, socket, availableFriends, fetchPendingInvites]
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
        await fetchPendingInvites(); // Tải lại danh sách lời mời
        await fetchAvailableFriends(); // Tải lại danh sách bạn bè
        if (fetchMemberInGroupDetails) {
          fetchMemberInGroupDetails();
        }
      } catch (error) {
        console.error("Lỗi chấp nhận lời mời:", error);
        Alert.alert("Lỗi", "Không thể chấp nhận lời mời nhóm.");
      }
    },
    [chatId, socket, pendingInvites, fetchPendingInvites, fetchAvailableFriends]
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
        await fetchPendingInvites(); // Tải lại danh sách lời mời
      } catch (error) {
        console.error("Lỗi từ chối lời mời:", error);
        Alert.alert("Lỗi", "Không thể từ chối lời mời nhóm.");
      }
    },
    [chatId, socket, pendingInvites, fetchPendingInvites]
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
        const friend = availableFriends.find((f) => f._id === invitedUser);
        setPendingInvites((prev) => [
          ...prev,
          {
            _id: inviteId,
            groupId,
            invitedUser: {
              _id: invitedUser,
              fullName: friend?.fullName,
              avatar:
                friend?.avatar ||
                "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
            },
            invitedBy,
            status: "pending",
          },
        ]);
        // Alert.alert(
        //   "Lời mời mới",
        //   `Có lời mời nhóm mới từ người dùng ${invitedBy}.`
        // );
        fetchPendingInvites(); // Tải lại danh sách lời mời từ server
      }
    };

    const handleGroupInviteAccepted = ({ groupId, userId, inviteId }) => {
      if (groupId === chatId) {
        setPendingInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
        fetchPendingInvites();
        fetchAvailableFriends();
        if (fetchMemberInGroupDetails) {
          fetchMemberInGroupDetails();
        }
      }
    };

    const handleGroupInviteRejected = ({ groupId, userId, inviteId }) => {
      if (groupId === chatId) {
        setPendingInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
        fetchPendingInvites(); // Tải lại danh sách lời mời
      }
    };

    // socket.on("new-group-invite", handleNewGroupInvite);
    socket.on("group-invite-accepted", handleGroupInviteAccepted);
    socket.on("group-invite-rejected", handleGroupInviteRejected);
    socket.on("new-group-invite", handleNewGroupInvite);
    socket.on("group-invite-accepted", handleGroupInviteAccepted);
    socket.on("group-invite-rejected", handleGroupInviteRejected);

    return () => {
      // socket.off("new-group-invite", handleNewGroupInvite);
      socket.off("group-invite-accepted", handleGroupInviteAccepted);
      socket.off("group-invite-rejected", handleGroupInviteRejected);
      socket.off("new-group-invite", handleNewGroupInvite);
      socket.off("group-invite-accepted", handleGroupInviteAccepted);
      socket.off("group-invite-rejected", handleGroupInviteRejected);
    };
  }, [socket, chatId, fetchPendingInvites, fetchAvailableFriends]);

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

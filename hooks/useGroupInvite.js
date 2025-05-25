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
      const invites = await getPendingGroupInvites();
      setPendingInvites(invites.data || []);
    } catch (error) {
      //   console.error("Error fetching pending invites:", error);
      //   Alert.alert("Error", "Unable to load pending invites.");
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
      //   console.error("Error fetching available friends:", error);
      //   Alert.alert("Error", "Unable to load friends list.");
    } finally {
      setLoadingFriends(false);
    }
  }, [chatId]);

  // Send group invite
  const handleSendInvite = async (invitedUserId) => {
    try {
      await sendGroupInvite(chatId, invitedUserId, userId);
      const inviteId = `temp-${Date.now()}-${invitedUserId}`;
      socket?.emit("new-group-invite", {
        groupId: chatId,
        invitedUser: invitedUserId,
        invitedBy: userId,
        inviteId,
      });
      Alert.alert("Success", "Group invite sent.");
      return inviteId;
    } catch (error) {
      console.error("Error sending group invite:", error);
      Alert.alert("Error", "Unable to send group invite.");
      throw error;
    }
  };

  // Accept group invite
  const handleAcceptInvite = async (inviteId) => {
    try {
      await acceptGroupInvite(inviteId);
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );
      const invite = pendingInvites.find((inv) => inv._id === inviteId);
      socket?.emit("group-invite-accepted", {
        groupId: chatId,
        userId: invite?.invitedUser._id,
        inviteId,
      });
      Alert.alert("Success", "Group invite accepted.");
    } catch (error) {
      console.error("Error accepting group invite:", error);
      Alert.alert("Error", "Unable to accept group invite.");
    }
  };

  // Reject group invite
  const handleRejectInvite = async (inviteId) => {
    try {
      await rejectGroupInvite(inviteId);
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );
      const invite = pendingInvites.find((inv) => inv._id === inviteId);
      socket?.emit("group-invite-rejected", {
        groupId: chatId,
        userId: invite?.invitedUser._id,
        inviteId,
      });
      Alert.alert("Success", "Group invite rejected.");
    } catch (error) {
      console.error("Error rejecting group invite:", error);
      Alert.alert("Error", "Unable to reject group invite.");
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chatId) return;

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
          },
        ]);
        Alert.alert("New Invite", `New group invite from ${invitedBy}.`);
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

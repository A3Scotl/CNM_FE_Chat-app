import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (error) {
    console.error("❌ Lỗi khi lấy token từ AsyncStorage:", error);
    return null;
  }
};

// Gửi lời mời tham gia nhóm
export const sendGroupInvite = async (groupId, userId, currentUserId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/pendingGroupInvite`,
      {
        groupId,
        invitedUser: userId,
        invitedBy: currentUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error(
      "❌ Lỗi khi gửi lời mời tham gia nhóm:",
      error?.response?.data || error
    );
    throw error;
  }
};

// Chấp nhận lời mời tham gia nhóm
export const acceptGroupInvite = async (inviteId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/pendingGroupInvite/${inviteId}/accept`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error(
      "❌ Lỗi khi chấp nhận lời mời nhóm:",
      error?.response?.data || error
    );
    throw error;
  }
};

// Từ chối lời mời tham gia nhóm
export const rejectGroupInvite = async (inviteId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/pendingGroupInvite/${inviteId}/reject`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error(
      "❌ Lỗi khi từ chối lời mời nhóm:",
      error?.response?.data || error
    );
    throw error;
  }
};

// Lấy danh sách lời mời nhóm theo group ID (cho chủ nhóm xem)
export const getPendingGroupInvitesByGroup = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get(`/pendingGroupInvite/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("API response:", JSON.stringify(res.data, null, 2));
    // Filter only pending invites on the client side
    const pendingInvites = Array.isArray(res.data)
      ? res.data.filter((invite) => invite.status === "pending")
      : [];
    return pendingInvites;
  } catch (error) {
    console.error("Lỗi lấy danh sách lời mời:", error?.response?.data || error);
    throw error;
  }
};

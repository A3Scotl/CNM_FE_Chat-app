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

export const sendGroupInvite = async (
  groupId,
  invitedUser,
  invitedBy,
  retries = 2
) => {
  try {
    // if (!groupId || !invitedUser || !invitedBy) {
    //   throw new Error("groupId, invitedUser hoặc invitedBy không hợp lệ");
    // }
    // if (
    //   typeof groupId !== "string" ||
    //   typeof invitedUser !== "string" ||
    //   typeof invitedBy !== "string"
    // ) {
    //   throw new Error("groupId, invitedUser và invitedBy phải là chuỗi");
    // }

    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    // console.log("pendingGroupInvite.api - token:", token.slice(0, 10) + "...");
    // console.log("pendingGroupInvite.api - sendGroupInvite:", {
    //   groupId,
    //   invitedUser,
    //   invitedBy,
    // });

    const res = await axiosInstance.post(
      `/pendingGroupInvite/`,
      { groupId, invitedUser, invitedBy },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data.data || res.data;
  } catch (error) {
    // console.error(
    //   "❌ Lỗi khi gửi lời mời nhóm:",
    //   error?.response?.data || error
    // );
    // throw error;
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
    return res.data.data || res.data;
  } catch (error) {
    // console.error(
    //   "❌ Lỗi khi chấp nhận lời mời nhóm:",
    //   error?.response?.data || error
    // );
    // throw error;
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
    return res.data.data || res.data;
  } catch (error) {
    // console.error(
    //   "❌ Lỗi khi từ chối lời mời nhóm:",
    //   error?.response?.data || error
    // );
    // throw error;
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
    // console.log("API response:", JSON.stringify(res.data, null, 2));
    // Filter only pending invites on the client side
    const pendingInvites = Array.isArray(res.data)
      ? res.data.filter((invite) => invite.status === "pending")
      : [];
    return pendingInvites;
  } catch (error) {
    // console.error(
    //   "❌ Lỗi khi lấy danh sách lời mời nhóm:",
    //   error?.response?.data || error
    // );
    // throw error;
  }
};

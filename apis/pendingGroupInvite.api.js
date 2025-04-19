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
export const sendGroupInvite = async (groupId, userId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/group/invite/${groupId}`,
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi gửi lời mời tham gia nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Chấp nhận lời mời tham gia nhóm
export const acceptGroupInvite = async (inviteId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/group/invite/accept/${inviteId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi chấp nhận lời mời nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Từ chối lời mời tham gia nhóm
export const rejectGroupInvite = async (inviteId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/group/invite/reject/${inviteId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi từ chối lời mời nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách lời mời nhóm đang chờ xử lý
export const getPendingGroupInvites = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get("/group/invite/pending", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách lời mời nhóm:", error?.response?.data || error);
    throw error;
  }
};
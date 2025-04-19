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

// Tạo nhóm mới
export const createGroup = async (groupData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post("/conversationGroup", groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách nhóm của người dùng
export const getMyGroups = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get("/group/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Thêm thành viên vào nhóm
export const addGroupMember = async (groupId, userId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/group/add-member/${groupId}`,
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi thêm thành viên vào nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Rời nhóm
export const leaveGroup = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(`/group/leave/${groupId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi rời nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Giải tán nhóm
export const disbandGroup = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.delete(`/group/disband/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi giải tán nhóm:", error?.response?.data || error);
    throw error;
  }
};
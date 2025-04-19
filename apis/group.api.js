import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Hàm lấy token từ AsyncStorage
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (error) {
    console.error("❌ Lỗi khi lấy token từ AsyncStorage:", error);
    return null;
  }
};

// Hàm tạo nhóm chat
export const createGroupChat = async (groupData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post("/conversation/group", groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm chat:", error?.response?.data || error.message || error);
    throw error;
  }
};

// Hàm lấy danh sách nhóm chat
export const getGroupConversations = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get("/conversation/groups", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nhóm chat:", error?.response?.data || error.message || error);
    throw error;
  }
};
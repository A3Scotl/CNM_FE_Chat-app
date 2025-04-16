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

// Hàm lấy danh sách cuộc trò chuyện của người dùng
export const getMyConversations = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");
    
    const res = await axiosInstance.get("/conversation/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách cuộc trò chuyện:", error?.response?.data || error.message || error);
    throw error;
  }
};

// Hàm lấy chi tiết cuộc trò chuyện theo ID
export const getConversationDetail = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get(`/conversation/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết cuộc trò chuyện:", error?.response?.data || error.message || error);
    throw error;
  }
};

// Hàm lấy hoặc tạo chi tiết cuộc trò chuyện
export const getOrCreateConversationDetail = async (to) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post("/conversation/detail", { to }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy hoặc tạo chi tiết cuộc trò chuyện:", error?.response?.data || error.message || error);
    throw error;
  }
};

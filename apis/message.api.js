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
// Gửi tin nhắn
export const sendMessage = async (messageData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");


    const res = await axiosInstance.post(
      "/message/send", // Endpoint để gửi tin nhắn
      messageData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error?.response?.data || error);
    throw error;
  }
};


// Lấy tin nhắn của cuộc trò chuyện
export const getMessages = async (conversationId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get(`/message/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const messages = res.data?.data || []; // 👉 Lấy đúng mảng tin nhắn từ res.data.data

    return messages;
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn:", error?.response?.data || error);
    throw error;
  }
};


// Ẩn cuộc trò chuyện
export const hideConversation = async (conversationId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.patch(
      `/message/hide/${conversationId}`, // Endpoint ẩn cuộc trò chuyện
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi ẩn cuộc trò chuyện:", error?.response?.data || error);
    throw error;
  }
};

// Thu hồi tin nhắn
export const recallMessage = async (messageId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.put(
      `/message/recall/${messageId}`, // Endpoint thu hồi tin nhắn
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi thu hồi tin nhắn:", error?.response?.data || error);
    throw error;
  }
};

// Chuyển tiếp tin nhắn
export const forwardMessage = async (messageData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      "/message/forward", // Endpoint chuyển tiếp tin nhắn
      messageData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi chuyển tiếp tin nhắn:", error?.response?.data || error);
    throw error;
  }
};

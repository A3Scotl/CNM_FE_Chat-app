// message.api.js
import axios from "axios";

const BASE_URL = "http://192.168.1.3:5000/api"; // hoặc dùng biến môi trường nếu có

export const sendMessage = async (messageData, token) => {
  try {
    console.log("📤 Gửi API với token:", token);
    const res = await axios.post(`${BASE_URL}/message/send`, messageData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error sending message:", error?.response?.data || error);
    throw error;
  }
};

export const getMessages = async (conversationId, token) => {
  try {
    const res = await axios.get(`${BASE_URL}/message/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error getting messages:", error);
    throw error;
  }
};

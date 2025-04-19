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

// Gửi yêu cầu kết bạn
export const sendFriendRequest = async (receiverId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post("/friend-request/send", { to: receiverId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data || res.data;
  } catch (error) {
    console.error("❌ Lỗi khi gửi yêu cầu kết bạn:", error?.response?.data || error);
    throw error;
  }
};

// Chấp nhận yêu cầu kết bạn
export const acceptFriendRequest = async (requestId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.put(`/friend-request/accept/${requestId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data || res.data;
  } catch (error) {
    console.error("❌ Lỗi khi chấp nhận yêu cầu kết bạn:", error?.response?.data || error);
    throw error;
  }
};

// Từ chối yêu cầu kết bạn
export const rejectFriendRequest = async (requestId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.put(`/friend-request/reject/${requestId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data || res.data;
  } catch (error) {
    console.error("❌ Lỗi khi từ chối yêu cầu kết bạn:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách bạn bè
export const getFriends = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get("/friend-request/friends", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data || res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách bạn bè:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách yêu cầu kết bạn đã nhận
export const getFriendRequests = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get("/friend-request/pending", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data || res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách yêu cầu kết bạn:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách yêu cầu kết bạn đã gửi
export const getSentFriendRequests = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get("/friend-request/sent", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data || res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách yêu cầu đã gửi:", error?.response?.data || error);
    throw error;
  }
};
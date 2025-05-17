import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
API_URL != null ? API_URL : "https://be.haudev.io.vn/api";
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error getting token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
export const handleApiError = (error) => {
  // console.error("API Error:", {
  //   message: error.message,
  //   response: error.response?.data,
  //   status: error.response?.status,
  // });

  if (error.response) {
    const { status, data } = error.response;
    if (status === 400) return data.message || "Yêu cầu không hợp lệ.";
    if (status === 401)
      return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) return "Bạn không có quyền thực hiện hành động này.";
    if (status === 404) return "Không tìm thấy tài nguyên.";
    if (status === 500) {
      return data.message === "next is not a function"
        ? "Lỗi máy chủ khi xử lý yêu cầu. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
        : data.message || "Lỗi máy chủ. Vui lòng thử lại sau.";
    }
    return data.message || "Đã xảy ra lỗi không xác định.";
  }
  if (error.request) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
  }
  return error.message || "Đã xảy ra lỗi.";
};

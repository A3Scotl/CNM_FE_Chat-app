import axios from "axios";

const API_BASE_URL = "";

export const login = async ({ phoneNumber, passWord }) => {
  try {
    const { data } = await axios.post(
      'http://localhost:5000/api/auth/log-in',
      { phoneNumber, passWord },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );
    return data;
  } catch (error) {
    console.error('Login API Error:', {
      request: error.config,
      response: error.response?.data
    });
    throw error.response?.data || { message: 'Đăng nhập thất bại' };
  }
};
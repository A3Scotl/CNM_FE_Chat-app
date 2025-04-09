import axios from "axios";

const API_BASE_URL = "http://192.168.110.60:5000/api";

export const login = async ({ phoneNumber, passWord }) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/auth/log-in`,
      { phoneNumber, passWord },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        timeout: 10000 //timeout để tránh request treo
      }
    ); 
    if (data.accessToken) {  
    }
    
    return data;
    
  } catch (error) {
    let errorMessage = 'Đăng nhập thất bại'; 
    if (error.response) {
      // Lỗi từ phía server (4xx, 5xx)
      console.error('Login Error - Server Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      errorMessage = error.response.data.message || errorMessage;
      
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('Login Error - No Response:', error.request);
      errorMessage = 'Không thể kết nối đến server';
      
    } else {
      // Lỗi khi thiết lập request
      console.error('Login Error - Setup:', error.message);
      errorMessage = 'Lỗi khi thiết lập yêu cầu đăng nhập';
    }
    
    // Tạo error object thống nhất
    const formattedError = new Error(errorMessage);
    formattedError.details = error.response?.data || {};
    formattedError.status = error.response?.status;
    
    throw formattedError;
  }
};
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
// import { API_URL } from '@env';
const API_URL = 'http://192.168.1.189:5000/api'
export const getMyProfile = async (id, token) => {
    try {
      const res = await axios.get(`${API_URL}/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (err) {
      console.error('Lỗi khi gọi getMyProfile:', err.message, err.config?.url);
      throw err;
    }
  };
  
export const uploadAvatar = async (avatarUri, token, userId) => {
  try {
    // Đọc file và encode sang base64
    const base64 = await FileSystem.readAsStringAsync(avatarUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileType = avatarUri.split('.').pop();
    const data = {
      avatar: `data:image/${fileType};base64,${base64}`
    };

    const response = await axios.patch(
      `${API_URL}/user/${userId}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    return response.data.user;
  } catch (error) {
    console.error('Upload error:', {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

import axiosInstance from "./axiosInstance";
import * as FileSystem from 'expo-file-system';
import { handleApiError } from "../utils/handleApiError";

export const getMyProfile = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user/${id}`);
    return data.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const uploadAvatar = async (avatarUri, userId) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(avatarUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileType = avatarUri.split('.').pop();
    const data = {
      avatar: `data:image/${fileType};base64,${base64}`
    };

    const response = await axiosInstance.patch(
      `/user/${userId}`,
      data
    );
    console.log('Upload response:', response.data);
    return response.data.user;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const searchUserByPhone = async (phone) => {
  try {
    const { data } = await axiosInstance.get(`/users/search?phone=${phone}`);
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
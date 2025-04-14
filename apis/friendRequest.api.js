import axiosInstance from "../utils/axiosInstance";
import { handleApiError } from "../utils/handleApiError";


export const sendRequest = async (toUserId) => {
  try {
    const { data } = await axiosInstance.post(`/friend-request/send`, { to: toUserId });
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getPendingRequests = async () => {
  try {
    const { data } = await axiosInstance.get(`/friend-request/pending`);
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const acceptRequest = async (requestId) => {
  try {
    const { data } = await axiosInstance.put(`/friend-request/accept/${requestId}`, {});
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const rejectRequest = async (requestId) => {
  try {
    const { data } = await axiosInstance.put(`/friend-request/reject/${requestId}`, {});
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
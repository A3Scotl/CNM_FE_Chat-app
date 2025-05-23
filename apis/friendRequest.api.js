import axiosInstance from "../utils/axiosInstance";
import { handleApiError } from "../utils/handleApiError";

const friendRequest = {
  sendRequest: async (receiverId) => {
    try {
      const response = await axiosInstance.post("/friend-request/send", { to: receiverId });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error) || "Failed to send friend request");
    }
  },

  getRequests: async () => {
    try {
      const response = await axiosInstance.get("/friend-request/pending");
      // console.log(response.data.data._id)
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error) || "Failed to fetch pending requests");
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const response = await axiosInstance.put(`/friend-request/accept/${requestId}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error) || "Failed to accept friend request");
    }
  },

  rejectRequest: async (requestId) => {
    try {
      const response = await axiosInstance.put(`/friend-request/reject/${requestId}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error) || "Failed to reject friend request");
    }
  },

  getFriends: async () => {
    try {
      const response = await axiosInstance.get("/friend-request/friends");
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error) || "Failed to fetch friends");
    }
  },

  getSentFriendsRequest: async () => {
    try {
      const response = await axiosInstance.get("/friend-request/sent");
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(handleApiError(error) || "Failed to fetch sent requests");
    }
  },
};

export default friendRequest;
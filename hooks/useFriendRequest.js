import { useState } from "react";
import * as api from "../apis/friendRequest.api";

export const useFriendRequest = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const fetchRequests = async () => {
    try {
      const data = await api.getPendingRequests();
      setPendingRequests(data.pendingRequests || []);
      setSentRequests(data.sentRequests || []);
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Failed to fetch friend requests:", error);
    }
  };

  const sendRequest = async (toUserId) => {
    try {
      await api.sendRequest(toUserId);
      await fetchRequests();
    } catch (error) {
      console.error("Failed to send friend request:", error);
      throw error;
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await api.acceptRequest(requestId);
      await fetchRequests();
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      throw error;
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.rejectRequest(requestId);
      await fetchRequests();
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      throw error;
    }
  };

  return {
    pendingRequests,
    sentRequests,
    friends,
    fetchRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
  };
};
import { useState, useEffect, useCallback } from "react";
import {
  sendRequest,
  getRequests,
  acceptRequest,
  rejectRequest,
} from "../apis/friendRequest.api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useFriendRequest = () => {
  const [userId, setUserId] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserIdFromStorage = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        throw new Error("User ID not found in storage");
      }
    } catch (err) {
      console.error("Error getting userId from AsyncStorage:", err);
      setError(err);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getRequests(userId);
      const pendingData = Array.isArray(response?.data)
        ? response.data.filter(
            (req) =>
              (req.to?._id === userId || req.to === userId) &&
              req.status === "pending"
          )
        : [];
      const sentData = Array.isArray(response?.data)
        ? response.data.filter(
            (req) =>
              (req.from?._id === userId || req.from === userId) &&
              req.status === "pending"
          )
        : [];
      setPendingRequests(pendingData);
      setSentRequests(sentData);
      console.log("Pending requests:", pendingData);
      console.log("Sent requests:", sentData);
    } catch (err) {
      console.error("Failed to fetch pending friend requests:", err);
      setError(err);
      setPendingRequests([]);
      setSentRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendRequestAction = async (receiverId) => {
    if (!userId) {
      setError(new Error("User ID not found. Please log in again."));
      return;
    }
    if (!receiverId) {
      setError(new Error("Receiver ID is required."));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newRequest = await sendRequest(receiverId);
      setSentRequests((prev) => [...prev, newRequest]);
      await fetchPendingRequests(); // Refresh sent requests
      console.log("Friend request sent to:", receiverId);
      return newRequest;
    } catch (err) {
      console.error("Failed to send friend request:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptRequestAction = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await acceptRequest(requestId);
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
      console.log("Accepted friend request:", requestId);
      return response;
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectRequestAction = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      await rejectRequest(requestId);
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
      console.log("Rejected friend request:", requestId);
    } catch (err) {
      console.error("Failed to reject friend request:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserIdFromStorage();
  }, [getUserIdFromStorage]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests, userId]);

  return {
    loading,
    error,
    pendingRequests,
    sentRequests,
    fetchPendingRequests,
    sendRequest: sendRequestAction,
    acceptRequest: acceptRequestAction,
    rejectRequest: rejectRequestAction,
  };
};
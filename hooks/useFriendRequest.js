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
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [errorAccepted, setErrorAccepted] = useState(null);

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
      console.log("Pending requests response:", response.data);
      const pendingData = Array.isArray(response?.data)
        ? response.data.filter(
            (req) =>
              (req.to === userId || req.to?._id === userId) &&
              req.status === "pending"
          )
        : [];
      const sentData = Array.isArray(response?.data)
        ? response.data.filter(
            (req) =>
              (req.from === userId || req.from?._id === userId) &&
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

  const fetchAcceptedRequests = useCallback(async () => {
    if (!userId) return;
    setLoadingAccepted(true);
    setErrorAccepted(null);
    try {
      const response = await getRequests(userId);
      console.log("Accepted requests raw response:", response.data);

      const acceptedData = Array.isArray(response?.data)
        ? response.data.filter(
            (req) =>
              (req.from === userId || req.to === userId) &&
              req.status === "accepted"
          )
        : [];
      console.log("Filtered accepted requests:", acceptedData);

      // Assuming API returns full user objects in from/to or we need to fetch them
      const friends = [];
      acceptedData.forEach((req) => {
        if (req.from === userId && req.to) {
          // Add the 'to' user as a friend
          if (!friends.some((friend) => friend._id === req.to._id || friend._id === req.to)) {
            friends.push({
              _id: typeof req.to === "string" ? req.to : req.to._id,
              fullName: typeof req.to === "object" ? req.to.fullName : "Unknown",
              avatar: typeof req.to === "object" ? req.to.avatar : "https://i.pravatar.cc/150",
            });
          }
        } else if (req.to === userId && req.from) {
          // Add the 'from' user as a friend
          if (!friends.some((friend) => friend._id === req.from._id || friend._id === req.from)) {
            friends.push({
              _id: typeof req.from === "string" ? req.from : req.from._id,
              fullName: typeof req.from === "object" ? req.from.fullName : "Unknown",
              avatar: typeof req.from === "object" ? req.from.avatar : "https://i.pravatar.cc/150",
            });
          }
        }
      });

      setAcceptedRequests(friends);
      console.log("Accepted requests (friends):", friends);
    } catch (err) {
      console.error("Failed to fetch accepted friend requests:", err);
      setErrorAccepted(err);
      setAcceptedRequests([]);
    } finally {
      setLoadingAccepted(false);
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
      await fetchPendingRequests();
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
      await fetchAcceptedRequests();
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

  return {
    loading,
    error,
    pendingRequests,
    acceptedRequests,
    sentRequests,
    fetchPendingRequests,
    fetchAcceptedRequests,
    sendRequest: sendRequestAction,
    acceptRequest: acceptRequestAction,
    rejectRequest: rejectRequestAction,
    loadingAccepted,
    errorAccepted,
  };
};
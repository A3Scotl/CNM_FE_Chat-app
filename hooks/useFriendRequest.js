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

  const fetchAcceptedRequests = useCallback(async () => {
    if (!userId) return;
    setLoadingAccepted(true);
    setErrorAccepted(null);
    try {
      const response = await getRequests(userId);
      const acceptedData = Array.isArray(response?.data)
        ? response.data.filter(
            (req) =>
              (req.from?._id === userId || req.to?._id === userId) &&
              req.status === "accepted"
          )
        : [];

      const friends = [];
      acceptedData.forEach((req) => {
        if (req.from?._id === userId && req.to) {
          if (!friends.some((friend) => friend._id === req.to._id)) {
            friends.push(req.to);
          }
        } else if (req.to?._id === userId && req.from) {
          if (!friends.some((friend) => friend._id === req.from._id)) {
            friends.push(req.from);
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
      // Optimistically update accepted requests
      // Find the accepted request in pending and add to accepted
      const acceptedReq = pendingRequests.find(req => req._id === requestId);
      if (acceptedReq) {
        const friend = acceptedReq.from?._id === userId ? acceptedReq.to : acceptedReq.from;
        if (friend) {
          setAcceptedRequests(prev => [...prev, friend]);
        }
      }
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
    fetchAcceptedRequests(); // Call the new function here
  }, [fetchPendingRequests, fetchAcceptedRequests, userId]);

  return {
    loading,
    error,
    pendingRequests,
    acceptedRequests, // Expose the new state
    sentRequests,
    fetchPendingRequests,
    fetchAcceptedRequests, // Expose the new fetch function
    sendRequest: sendRequestAction,
    acceptRequest: acceptRequestAction,
    rejectRequest: rejectRequestAction,
    loadingAccepted, // Expose the new loading state
    errorAccepted,   // Expose the new error state
  };
};
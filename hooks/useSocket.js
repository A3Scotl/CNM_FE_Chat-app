import { useEffect } from "react";
import io from "socket.io-client";
import { Alert } from "react-native";

// const SOCKET_URL = "https://be.haudev.io.vn/api"; // Adjust to your backend URL
const SOCKET_URL = "http://192.168.1.3:5000/api";

export const useSocket = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      query: { userId },
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    socket.on("friend-request", ({ message, from, requestId }) => {
      Alert.alert("New Friend Request", `${message} from ${from.fullName}`);
    });

    socket.on("friend-request-accepted", ({ message, user }) => {
      Alert.alert("Friend Request Accepted", message);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);
};

// utils/socket.js
import { io } from "socket.io-client";

export const createSocket = (token) => {
  return io("http://192.168.1.3:5000/api", {
    transports: ["websocket"],
    autoConnect: true,
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};

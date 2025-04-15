import { io } from "socket.io-client";

export const createSocket = (token) => {
  const socket = io("http://192.168.1.3:5000", {
    transports: ["websocket"],
    auth: {
      token: token, // Gửi token qua auth (phù hợp với server bạn đang dùng)
    },
  });

  socket.on("connect_error", (err) => {
    console.error("Error connecting to socket:", err);
  });

  return socket;
};

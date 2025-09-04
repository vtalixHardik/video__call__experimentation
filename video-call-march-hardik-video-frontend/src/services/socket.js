import { io } from "socket.io-client";
import axios from "axios";


const ip = 14;
const URL = `http://192.168.1.${ip}:3015`;

const socket = io(URL, {
  autoConnect: false,
  path: "/api/v1/signalling/socket",  // this must match the backend
  transports: ["websocket"],          // optional: force WebSocket
});

// const socket = io("https://dev-api.vtalix.com", {
// 	autoConnect: false,
// 	path: "/api/v1/signalling/socket",  // this must match the backend
// 	transports: ["websocket"],          // optional: force WebSocket
// });

export const connectSocket = () => {
  try {

  console.log("URL before IF is", URL);
  if (!socket.connected) {
    console.log("URL before connecting is", URL);
    socket.connect()
    return socket;
  };
  console.log("URL after IF is", URL);
  } catch (error) {
    console.log("Error while connection to socket is ", error);
  }
};



export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const listenForUserLeft = (callback) => {
  socket.on("user_left", callback);
}

export const listenForErrors = (callback) => {
  // console.error("Listening for errors on socket");
  socket.on("error", callback);
};

export const joinRoom = (appointment_id, name) => {
  console.log("joining room with appointment_id: ", appointment_id, " and name: ", name);
  socket.emit("join_room", { appointment_id, name });
};

export const listenForJoinSuccess = (callback) => {
  socket.on("joined_successfully", callback);
};

export const listenForOffer = (callback) => {
  socket.on("receive_offer", callback);
};

export const sendAnswer = (appointment_id, answer, remoteSocketId) => {
  socket.emit("send_answer", { appointment_id, answer, remoteSocketId });
};

export const sendOffer = (appointment_id, offer, remoteSocketId) => {
  socket.emit("send_offer", { appointment_id, offer, remoteSocketId });
};

export const listenForAnswer = (callback) => {
  socket.on("receive_answer", callback);
};

export const sendICE = (remoteSocketId, candidate) => {
  console.log("sending ICE candidate")
  console.log("sending ICE candidate", remoteSocketId);
  console.log("sending ICE candidate", candidate);
  socket.emit("ice_candidate", { remoteSocketId, candidate });
};

export const saveChats = async (appointment_id, chats) => {
  try {
    const response = await axios.put(
      `http://localhost:3015/api/v1/signalling/save-chats/${appointment_id}`,
      { chats }
    );
    return response.data;  // Return the saved data if needed
  } catch (error) {
    console.error("Failed to save chats:", error);
    throw error;  // Re-throw for higher-level error handling
  }
};



export const listenForICE = (callback) => {
  socket.on("ice_candidate", callback);
};

export const resetSockets = () => {
  socket.off("joined_successfully");
  socket.off("receive_offer");
  socket.off("receive_answer");
  socket.off("ice_candidate");
  socket.off("user_left");
  socket.off("error");
}


export default socket;
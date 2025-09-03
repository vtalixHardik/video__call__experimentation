import { createSlice } from "@reduxjs/toolkit";
import { io } from "socket.io-client";

const initialState = {
  socket: null,
  messages: [],

};

const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InZ0YWxpeF80Iiwicm9sZSI6InBhdGllbnQiLCJpYXQiOjE3NDEwMDI2OTUsImV4cCI6MTc0MTI2MTg5NX0.oVIpon0yGtcVSQiECNIc9dP__icNciS0u4g59eJcWZk`;

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    connectSocket: (state, action) => {
        const {meetingId} = action.payload;
      if (!state.socket) {
        state.socket = io("http://localhost:3015", {
          auth: {
            token: localStorage.getItem("token") || token, // JWT for authentication
          },
          query: {
            meetingId: meetingId, // Attach meeting ID
          },
        });
      }
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
      }
    },
  },
});

export const { connectSocket, addMessage, disconnectSocket } = socketSlice.actions;
export default socketSlice.reducer;

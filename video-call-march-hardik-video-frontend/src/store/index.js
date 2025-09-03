import { configureStore } from "@reduxjs/toolkit";
import callReducer from "./callSlice";
import socketReducer from "./socketSlice";

const store = configureStore({
  reducer: {
    call: callReducer,
    socket: socketReducer
  },
});

export default store;

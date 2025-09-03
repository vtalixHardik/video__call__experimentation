import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/apiClient";

// Async thunk to start a call
export const startCall = createAsyncThunk(
  "call/startCall",
  async ({ appointment_id, offer }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/call/start", {
        appointment_id,
        offer,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const callSlice = createSlice({
  name: "call",
  initialState: {
    meetingId: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(startCall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startCall.fulfilled, (state, action) => {
        state.loading = false;
        state.meetingId = action.payload.meetingId;
      })
      .addCase(startCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Something went wrong";
      });
  },
});

export default callSlice.reducer;

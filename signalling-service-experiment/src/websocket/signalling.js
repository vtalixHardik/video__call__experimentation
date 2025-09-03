// todo: this file is not getting used.
// todo: this is just the file that i made while trying to create the connection.
// NOTE: DO NOT USE THIS FILE IN THE INTEGRATION PROCESS

// const { Server } = require("socket.io");
// const {authMiddleware} = require("../middlewares/authMiddleware");
// const { updateSocketId } = require("../services/socketServices");

// console.log("auth middleware is ", authMiddleware);
// const setupSocketServer = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//     }
//   });

//   // Apply authentication middleware
//   io.use(authMiddleware);
//   io.use((socket, next) => {
//     socket.on("error", (err) => {
//       console.error("Socket.IO Error:", err.message || err);
//     });
//     next();
//   });    

//   io.on("connection", async (socket) => {
//     console.log(`User connected: ${socket.user.id}, Role: ${socket.user.role}`);

//     socket.on("join_room", async ({ meetingId }) => {
//       socket.join(meetingId);
//       console.log(`User ${socket.user.id} joined room ${meetingId}`);
//       console.log("socket id is ", socket.id);
//       await updateSocketId(meetingId, socket.user.id, socket.user.role, socket.id);
//     });

//     socket.on("offer", ({ meetingId, offer }) => {
//       socket.to(meetingId).emit("receive_offer", offer);
//     });

//     socket.on("answer", ({ meetingId, answer }) => {
//       socket.to(meetingId).emit("receive_answer", answer);
//     });

//     socket.on("ice_candidate", ({ meetingId, candidate }) => {
//       socket.to(meetingId).emit("receive_ice_candidate", candidate);
//     });

//     socket.on("chat_message", ({ meetingId, message }) => {
//       socket.to(meetingId).emit("receive_message", { user: socket.user.id, message });
//     });

//     socket.on("disconnect", () => {
//       console.log(`User ${socket.user.id} disconnected`);
//     });
//   });

//   console.log("Socket.IO server running with authentication...");
// };

// module.exports = { setupSocketServer };

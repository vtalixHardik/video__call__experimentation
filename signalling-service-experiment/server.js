// todo: the code after this comment will be the latest.

require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app"); // Import Express app
const sequelize = require("./src/config/db");
// const Meeting = require("./src/models/Meetings");
const MongoMeeting = require("./src/model/Meeting.js");
const Appointments = require("./src/models/Appointments");
const { validateToken } = require("./src/middlewares/authMiddleware");
const { Op } = require("sequelize");
const { Connection } = require("./src/config/mongo.js");
const { v4: uuidv4 } = require("uuid");

Connection();

const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });
const io = new Server(server, {
  path: "/api/v1/signalling/socket", // very important
  cors: {
    origin: "*", // Adjust for prod
    methods: ["GET", "POST"],
    // this should work
  },
});

app.get("/api/v1/signalling/health-status", (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate"); // Prevent caching
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  return res.status(200).send("Server is running");
});

app.put("/api/v1/signalling/save-chats/:appointment_id", async (req, res) => {
  console.log("Saving chats for appointment ID:", req.body.chats);
  const meeting = await MongoMeeting.findOne({
    appointment_id: req.params.appointment_id,
  });
  console.log("Meeting from chats is ", meeting);
  if (meeting) {
    meeting.chats = req.body.chats;
    // await Meeting.update(
    //     { chats: req.body },
    //     { where: { appointment_id: appointment_id } }
    //   );
    await meeting.save();
  }
  return res.status(200).json({
    success: true,
    message: "Chats saved successfully",
  });
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", async ({ appointment_id, name }) => {
    try {
      console.clear();
      console.log("User joined room:", appointment_id, "Name:", name);
      console.log("appointment id is ", appointment_id);

      let meeting;
      // meeting = await MongoMeeting.findOne({ where: { appointment_id } });
      meeting = await MongoMeeting.findOne({ appointment_id });

      console.log("meeting and appointment found");

      if (!meeting) {
        console.log("Creating new meeting");
        meeting = await MongoMeeting.create({ _id: uuidv4(), appointment_id });
      }

      let storedSocketId = null;
      if (meeting.user_one_socket) {
        storedSocketId = meeting.user_one_socket;
      } else if (meeting.user_two_socket) {
        storedSocketId = meeting.user_two_socket;
      }
      if (meeting.user_one_socket) {
        await MongoMeeting.updateOne(
          { appointment_id },
          { $set: { user_two_socket: socket.id, user_two_name: name } }
        );
        // await MongoMeeting.update(
        //   { user_two_socket: socket.id, user_two_name: name },
        //   { where: { appointment_id } }
        // );
      } else {
        await MongoMeeting.updateOne(
          { appointment_id },
          { $set: { user_one_socket: socket.id, user_one_name: name } }
        );
        // await MongoMeeting.update(
        //   {user_one_socket: socket.id, user_one_name: name },
        //   { where: { appointment_id } }
        // );
      }

      if (meeting.user_one_socket) {
        socket.emit("joined_successfully", {
          message: "Joined Successfully",
          remoteSocket: meeting.user_one_socket,
          opponent_name: meeting.user_one_name,
          chats: meeting.chats,
        });
      } else {
        socket.join(appointment_id);

        socket.emit("joined_successfully", {
          message: "Joined successfully",
          remoteSocket: null,
          opponent_name: null,
          chats: meeting.chats,
        });
        return;
      }
    } catch (error) {
      console.error("Join error:");
      console.error("Join error:", error);

      socket.emit("error", { message: "Join failed" });
    }
  });

  socket.on(
    "send_answer",
    async ({ appointment_id, answer, remoteSocketId }) => {
      try {
        console.log(
          "================================sending the answer======================================="
        );

        console.log(
          "remote socket id from the send answer is ",
          remoteSocketId
        );

        // console.log("Answer is ", answer);

        console.log("appointment ID is ", appointment_id);

        const meeting = await MongoMeeting.findOne({
          appointment_id,
        });

        if (!meeting) {
          console.log("Not found meeting in the send answer");
          socket.emit("error", { message: "No meeting found" });
          return;
        }

        if (!remoteSocketId) {
          console.log("No remote user found in the send answer");
          socket.emit("error", { message: "No remote user found" });
          return;
        }

        console.log(
          "================================ending the send answer======================================="
        );

        io.to(remoteSocketId).emit("receive_answer", {
          from: socket.id,
          answer,
        });
      } catch (error) {
        console.error("Send answer error:");
        console.error("Send answer error:", error);
        socket.emit("error", { message: "Error sending answer" });
      }
    }
  );

  socket.on("send_offer", async ({ appointment_id, offer, remoteSocketId }) => {
    try {
      console.log(
        "============================== send offer======================================="
      );

      console.log("remote socket id from the send offer is ", remoteSocketId);

      // console.log("Answer is send offer", offer);

      console.log("appointment ID is send offer", appointment_id);

      const meeting = await MongoMeeting.findOne({ appointment_id });

      if (!meeting) {
        console.log("Not found meeting in the send offer");
        socket.emit("error", { message: "No meeting found" });
        return;
      }

      if (!remoteSocketId) {
        console.log("No remote user found in send offer");
        socket.emit("error", {
          message: "No remote user found in send answer",
        });
        return;
      }

      console.log("emitting the receive offer from the send offer");

      io.to(remoteSocketId).emit("receive_offer", {
        from: socket.id,
        offer,
        name: meeting.user_two_name,
      });
    } catch (error) {
      console.error("Send offer error:");
      console.error("Send offer error:", error);
      socket.emit("error", { message: "Error sending offer" });
    }
  });

  socket.on("ice_candidate", async ({ remoteSocketId, candidate }) => {
    // console.log("sending ice candidate from ", socket.id, "to ", remote_socket_id );
    console.log("sending ICE")
    io.to(remoteSocketId).emit("ice_candidate", candidate);
  });

  // todo: the function has been completed
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.id.toString()}`);

    const meeting = await MongoMeeting.findOne({
      $or: [{ user_one_socket: socket.id }, { user_two_socket: socket.id }],
    });

    console.log("meeting is ", meeting);

    let remainingUserSocket = null;
    if (!meeting) {
      return;
    }
    if (meeting.user_one_socket === socket.id) {
      remainingUserSocket = meeting.user_two_socket;
      await MongoMeeting.updateOne(
        { appointment_id: meeting.appointment_id },
        { user_one_socket: null, user_one_name: null }
      );
    } else {
      remainingUserSocket = meeting.user_one_socket;
      await MongoMeeting.updateOne(
        { appointment_id: meeting.appointment_id },
        { user_two_socket: null, user_two_name: null }
      );
    }

    if (meeting) {
      // Notify the remaining user
      if (remainingUserSocket) {
        console.log("Remote Socket is ", remainingUserSocket);
        io.to(remainingUserSocket).emit("user_left", {
          message: "The other user has disconnected.",
        });
      }
    }
  });
});

server.listen(3015, async () => {
  console.log("Server running on port 3015");
});

// const User = require("../models/User");
const User = require("../models/Users");
const jwt = require("jsonwebtoken");
const expressAsyncHandler = require("express-async-handler");
const Meeting = require("../models/Meetings"); // Import Meeting model


module.exports.authMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers["authorization"];
    console.log("token is ", token);
    
    if (!token) {
      console.log("toek not found");
      return next(new Error("Authentication token missing"));
    }

    try{

      // const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user details to the socket object

      console.log("user is ", decoded);
      console.log("metin is ", socket.handshake.query);
      // Check if the user is in a valid meeting
    

      const meeting = await Meeting.findOne({
        where: {
          appointment_id: socket.handshake.query.meetingId,
          [decoded.role === "doctor" ? "doctor_id" : "patient_id"]: decoded.id
        }
      });
      console.log("meeting is ", meeting);
      if (!meeting) {
        console.log("meeting not found");
        return next(new Error("User not authorized for this meeting"));
      }

      console.log("working fine");
      next(); // Proceed if everything is fine
    }catch(err){
      console.log("error in fetching metting is ", err);
    }
  } catch (err) {
    next(new Error("Authentication failed"));
  }
};

module.exports.validateToken = async (token) => {
  console.log("token is validating");
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("decoed is ", decoded);
  return {id: decoded.id, role: decoded.role}
}

module.exports.checkStatus = expressAsyncHandler(async (req, res, next) => {
  if(req.user.account_status === "suspend"){
    throw new Error("You are a suspended User");
  }else{
    return next();
  }
});

module.exports.isAdmin = expressAsyncHandler(async (req, res, next) => {
  if (req.user.role === "admin")
    return next(); //if the user is admin then allow him to proceed
  else {
    throw new Error("You are not an admin");
  }
});
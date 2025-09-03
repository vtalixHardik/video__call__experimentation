import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, addMessage } from "../store/socketSlice";
import { useParams } from "react-router-dom";

const VideoCall = () => {
  const { meetingId } = useParams();
  console.log("meeting id is ", meetingId);
  const dispatch = useDispatch();
  const socket = useSelector((state) => state.socket.socket);

  useEffect(() => {
    dispatch(connectSocket({ meetingId }));

    if (socket) {
        console.log("socket found", socket);
      socket.emit("join_room", { meetingId });

      socket.on("receive_message", (data) => {
        console.log("Chat Message:", data);
        dispatch(addMessage(data));
      });

      socket.on("receive_offer", (offer) => {
        console.log("Received Offer:", offer);
      });

      socket.on("receive_answer", (answer) => {
        console.log("Received Answer:", answer);
      });

      socket.on("receive_ice_candidate", (candidate) => {
        console.log("Received ICE Candidate:", candidate);
      });
    }

    return () => {
      if (socket) {
        socket.off("receive_message");
        socket.off("receive_offer");
        socket.off("receive_answer");
        socket.off("receive_ice_candidate");
      }
    };
  }, [dispatch, socket, meetingId]);

  return <h1>Video Call - Meeting {meetingId}</h1>;
};

export default VideoCall;

import { useEffect, useRef, useState } from "react";
import iceServers from "../store/iceServer";
import mic__controls from "../assets/mic__control.svg";
import video__controls from "../assets/video__control.svg";
import end__call from "../assets/end__call.svg";
import { useNavigate } from "react-router-dom";
import { connectSocket, listenForJoinSuccess, listenForAnswer, listenForOffer, joinRoom, sendOffer, sendAnswer } from "../services/socket";

const Room5 = () => {
  try {
    const navigate = useNavigate();
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerCon = useRef(null);
    const remoteSocketRef = useRef();

    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [stage, setStage] = useState("Join");
    const [callStarted, setCallStarted] = useState(false);

    const getUserMediaDevices = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Your browser does not support camera access.");
        return;
      }

      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.error("Media access error:", err);
        alert("Failed to access camera/mic. Please check permissions.");
      }
    };

    const initializePeerConnection = async () => {
      peerCon.current = new RTCPeerConnection({ iceServers });

      peerCon.current.onicecandidate = (event) => {
        if (event.candidate) {
          // socket.emit("ice-candidate", { to: remoteSocketRef.current, candidate: event.candidate });
        }
      };

      peerCon.current.ontrack = (event) => {
        if (!remoteVideoRef.current.srcObject) {
          remoteVideoRef.current.srcObject = new MediaStream();
        }
        event.streams[0].getTracks().forEach((track) => {
          remoteVideoRef.current.srcObject.addTrack(track);
        });
        setRemoteStream(event.streams[0]);
        setStage("Connected");
      };
    };

    const startCall = async () => {
      setStage("Joining...");
      setCallStarted(true);
      await getUserMediaDevices();
      await initializePeerConnection();
      connectSocket();
      joinRoom(localStorage.getItem("appointmentId"), localStorage.getItem("token"));
    };

    const handleJoinSuccess = async (data) => {
      setStage("Waiting for other User");
      if (data.offer === null && data.remoteSocket === null) {
        await listenForOffer(answerPeer);
      } else {
        remoteSocketRef.current = data.remoteSocket;
        callPeer();
        await listenForAnswer(acceptPeer);
      }
    };

    const callPeer = async () => {
      try {
        const offer = await peerCon.current.createOffer();
        await peerCon.current.setLocalDescription(offer);
        sendOffer(localStorage.getItem("appointmentId"), localStorage.getItem("token"), offer, remoteSocketRef.current);
      } catch (error) {
        console.error("Error during callPeer:", error);
      }
    };

    const answerPeer = async (data) => {
      try {
        await peerCon.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerCon.current.createAnswer();
        await peerCon.current.setLocalDescription(answer);
        sendAnswer(localStorage.getItem("appointmentId"), localStorage.getItem("token"), answer, data.from);
        setStage("Connected");
      } catch (error) {
        console.error("Error in answerPeer:", error);
      }
    };

    const acceptPeer = async (data) => {
      try {
        await peerCon.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setStage("Connected");
      } catch (error) {
        console.error("Error in acceptPeer:", error);
      }
    };

    const toggleMic = () => {
      if (!stream) return;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    };

    const toggleCamera = async () => {
      if (!stream) return;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        setStream(null);
        setIsCameraOn(false);
      } else {
        await getUserMediaDevices();
        setIsCameraOn(true);
      }
    };

    const endCall = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }
      if (peerCon.current) {
        peerCon.current.close();
        peerCon.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setStage("Join");
      setCallStarted(false);
    };

    useEffect(() => {
      listenForJoinSuccess(handleJoinSuccess);
    }, []);

    return (
      <div className="video-call-container">
        {!callStarted ? (
          <button className="join-button" onClick={startCall}>
            Join Call
          </button>
        ) : (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
            <div className="controls">
              <button onClick={toggleMic}>{isMicOn ? "Mute Mic" : "Unmute Mic"}</button>
              <button onClick={toggleCamera}>{isCameraOn ? "Turn Off Camera" : "Turn On Camera"}</button>
              <button onClick={endCall}>End Call</button>
            </div>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.log("error is ", error);
  }
};

export default Room5;

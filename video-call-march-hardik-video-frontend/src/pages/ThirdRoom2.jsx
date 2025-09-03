import { useEffect, useRef, useState } from "react";
import { 
  connectSocket, 
  joinRoom, 
  listenForJoinSuccess, 
  sendOffer, 
  listenForAnswer, 
  listenForErrors, 
  listenForOffer, 
  sendAnswer, 
  sendICE, 
  listenForICE 
} from "../services/socket";

const ThirdRoom2 = () => {
  const userVideo = useRef();
  const remoteVideo = useRef();
  const peerRef = useRef();
  const userStream = useRef();
  const otherUser = useRef();
  const [connectionStatus, setConnectionStatus] = useState("Initializing");

  const appointment_id = localStorage.getItem("appointmentId");
  const token = localStorage.getItem("token");

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.stunprotocol.org" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" }
      ]
    });

    peer.onicecandidate = handleICECandidateEvent;
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = handleNegotiationNeeded;
    
    peer.onconnectionstatechange = () => {
      console.log("Connection state:", peer.connectionState);
      setConnectionStatus(peer.connectionState);
    };

    return peer;
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate:", event.candidate);
      sendICE(otherUser.current, event.candidate);
    }
  };

  const handleTrackEvent = async (event) => {
    // console.log("Remote track received:", event.streams[0]);
    // console.log("setting remote stream in video tag");
    // remoteVideo.current.srcObject = event.streams[0];
    if (event.streams.length > 0 && event.streams[0]) {
      console.log("✅ Setting remote stream in video tag", event.streams[0]);

      console.log("peerRef.current.remoteDescription is ", peerRef.current.remoteDescription);
  
      if (remoteVideo?.current) {
          const remoteStream = event.streams[0];
          remoteVideo.current.srcObject = null;
          remoteVideo.current.srcObject = remoteStream;
          remoteVideo.current.load();
          await remoteVideo.current.play().catch(error => console.error("Video play error:", error));
      }
      else {
        console.error("❌ remoteVideo ref is null");
      }
    } else {
      console.error("❌ No valid remote streams received.");
    }
  };

  const handleNegotiationNeeded = async () => {
    try {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      sendOffer(appointment_id, token, offer, otherUser.current);
    } catch (error) {
      console.error("Negotiation error:", error);
    }
  };

  const establishConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      userVideo.current.srcObject = stream;
      userStream.current = stream;

      const socket = connectSocket();
      
      socket.on('connect', () => {
        console.log("Socket connected with ID:", socket.id);
        joinRoom(appointment_id, token);
      });

      listenForJoinSuccess(handleJoinSuccess);
      listenForOffer(handleIncomingOffer);
      listenForAnswer(handleAnswer);
      listenForICE(handleNewICECandidate);
      listenForErrors(handleSocketErrors);

    } catch (error) {
      console.error("Connection establishment failed:", error);
      setConnectionStatus("Failed");
    }
  };

  const handleJoinSuccess = (data) => {
    console.log("Join success:", data);
    if (data.remoteSocket) {
      otherUser.current = data.remoteSocket;
      initiateCall();
    }
  };

  const initiateCall = () => {
    peerRef.current = createPeer();
    userStream.current.getTracks().forEach(track => 
      peerRef.current.addTrack(track, userStream.current)
    );
  };

  const handleIncomingOffer = async (offer) => {
    try {
      peerRef.current = createPeer();
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer.offer));
      
      userStream.current.getTracks().forEach(track => 
        peerRef.current.addTrack(track, userStream.current)
      );
      
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      
      sendAnswer(appointment_id, token, answer, offer.from);
    } catch (error) {
      console.error("Handling offer failed:", error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer.answer));
    } catch (error) {
      console.error("Setting remote description failed:", error);
    }
  };

  const handleNewICECandidate = async (candidate) => {
    try {
        console.log("peerRef is ", peerRef.current);
      await peerRef?.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Adding ICE candidate failed:", error);
    }
  };

  const handleSocketErrors = (error) => {
    console.error("Socket error:", error);
    setConnectionStatus("Error");
  };

  useEffect(() => {
    establishConnection();
    return () => {
      // Cleanup logic
      if (userStream.current) {
        userStream.current.getTracks().forEach(track => track.stop());
      }
      peerRef.current?.close();
    };
  }, []);

  return (
    <div>
      <div>Connection Status: {connectionStatus}</div>
      <video 
        ref={userVideo} 
        muted 
        autoPlay 
        playsInline 
        style={{ width: '500px', transform: 'scaleX(-1)' }} 
      />
      <video 
        ref={remoteVideo} 
        autoPlay 
        playsInline 
        style={{ width: '500px', transform: 'scaleX(-1)' }} 
      />
    </div>
  );
};

export default ThirdRoom2;
import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Update with your signaling server URL

const Room = () => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isCallStarted, setIsCallStarted] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null); // Store local stream

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Get user media (camera & mic)
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  // Create & configure PeerConnection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);

    pc.addEventListener("track", (event) => {
      console.log("Remote track received:", event);
      if (!remoteStream) {
        setRemoteStream(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    });

    pc.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
        console.log("ICE Candidate sent:", event.candidate);
      }
    });

    return pc;
  };

  // Start Call (Offer)
  const startCall = async () => {
    const localStream = await getUserMedia();
    const pc = createPeerConnection();
    setPeerConnection(pc);
    setIsCallStarted(true);

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", offer);
    console.log("Offer sent:", offer);
  };

  // Answer Call
  const answerCall = async (offer) => {
    const localStream = await getUserMedia();
    const pc = createPeerConnection();
    setPeerConnection(pc);
    setIsCallStarted(true);

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", answer);
    console.log("Answer sent:", answer);
  };

  // End Call
  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
      setIsCallStarted(false);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setRemoteStream(null);
  };

  // Toggle Camera
  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  // Listen for socket events (signaling)
  useEffect(() => {
    socket.on("offer", async (offer) => {
      console.log("Offer received:", offer);
      await answerCall(offer);
    });

    socket.on("answer", async (answer) => {
      console.log("Answer received:", answer);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      console.log("ICE Candidate received:", candidate);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [peerConnection]);

  /* 
  function closeVideoCall() {
  const remoteVideo = document.getElementById("received_video");
  const localVideo = document.getElementById("local_video");

  if (myPeerConnection) {
    myPeerConnection.ontrack = null;
    myPeerConnection.onremovetrack = null;
    myPeerConnection.onremovestream = null;
    myPeerConnection.onicecandidate = null;
    myPeerConnection.oniceconnectionstatechange = null;
    myPeerConnection.onsignalingstatechange = null;
    myPeerConnection.onicegatheringstatechange = null;
    myPeerConnection.onnegotiationneeded = null;

    if (remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
    }

    if (localVideo.srcObject) {
      localVideo.srcObject.getTracks().forEach((track) => track.stop());
    }

    myPeerConnection.close();
    myPeerConnection = null;
  }

  remoteVideo.removeAttribute("src");
  remoteVideo.removeAttribute("srcObject");
  localVideo.removeAttribute("src");
  localVideo.removeAttribute("srcObject");

  document.getElementById("hangup-button").disabled = true;
  targetUsername = null;
}
  */
  

  return (
    <div className="flex justify-center items-center flex-col w-screen h-screen">
      {/* Local Video */}
      <div className="w-full h-full flex justify-center items-center">
        <video ref={localVideoRef} autoPlay playsInline muted className="max-w-[500px] max-h-[500px]" />
      </div>

      {/* Remote Video */}
      {remoteStream && (
        <div className="w-full h-full flex justify-center items-center mt-4">
          <video ref={remoteVideoRef} autoPlay playsInline className="max-w-[500px] max-h-[500px]" />
        </div>
      )}

      {/* Controls */}
      <div className="w-full bg-[#9DA5B8] h-[80px] xl:h-[150px] flex justify-center items-center gap-12">
        <div
          className={`h-[75.5px] w-[75.5px] p-5 rounded-full ${isMicOn ? "bg-white" : "bg-red-600"}`}
          onClick={toggleMic}
        >
          Toggle Mic
        </div>
        {!isCallStarted ? (
          <div className="h-fit w-fit p-5 bg-green-600 text-white rounded-[22px]" onClick={startCall}>
            Start Call
          </div>
        ) : (
          <div className="h-fit w-fit p-5 bg-red-600 text-white rounded-[22px]" onClick={endCall}>
            End Call
          </div>
        )}
        <div
          className={`h-[75.5px] w-[75.5px] p-5 rounded-full ${isCameraOn ? "bg-white" : "bg-red-600"}`}
          onClick={toggleCamera}
        >
          Toggle Camera
        </div>
      </div>
    </div>
  );
};

export default Room;
// const toggleCamera = async () => {
//   if (!localStream) return;

//   // Stop and remove the existing video track
//   const videoTrack = localStream.getVideoTracks()[0];
//   if (videoTrack) {
//     videoTrack.stop();
//     localStream.removeTrack(videoTrack);
//   }

//   // Get new camera stream (you can specify `facingMode` for front/back switch)
//   const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
//   const newVideoTrack = newStream.getVideoTracks()[0];

//   // Add new track to the peer connection
//   localStream.addTrack(newVideoTrack);
//   peerConnection.addTrack(newVideoTrack, localStream);

//   // Manually create and send a new offer
//   const offer = await peerConnection.createOffer();
//   await peerConnection.setLocalDescription(offer);
  
//   sendSignalToPeer({ type: "offer", sdp: offer });
// };

import { useState } from "react";

const Chat = ({ chat, setChats, notes, setNotes, dataChannelRef }) => {
  const [focus, setFocus] = useState("chat");

  const sendMessage = (msg) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      dataChannelRef.current.send(msg);
      setChats((prev) => [...prev, { sender: "You", message: msg }]);
    } else {
      console.warn("DataChannel is not open yet.");
    }
  };
  
  return (
    <div className="flex flex-col justify-start items-center w-full h-full">
      <div className="flex justify-start items-center w-full h-fit pt-8 pb-3 pl-6 gap-8 border border-solid border-x-0 border-t-0 border-b-1 border-[#E1DEDA]">    
        <div
          className={` ${
            focus === "chat" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent"
          } border border-solid border-b-1 border-x-0 border-t-0`}
          onClick={() => setFocus("chat")}
        >
          <p className={` text-2xl font-medium cursor-pointer`}>Chat</p>
        </div>
        <div
          className={` ${
            focus === "notes" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent"
          } border border-solid border-b-1 border-x-0 border-t-0`}
          onClick={() => setFocus("notes")}
        >
          <p className={` text-2xl font-medium cursor-pointer`}>User Notes</p>
        </div>
      </div>
      {focus === "chat" && (
        <div className="flex flex-col justify-start items-center w-full grow">
          <div className="w-full grow">Chat</div>
          <div className="w-full h-[80px] flex justify-end items-center px-3 gap-2">
            <input
              type="text"
              className="grow max-w-[670px] h-full max-h-[53px] bg-white px-6 rounded-lg"
              placeholder="Type a message..."
            />
            <button className="bg-[#FF7201] text-white hover:bg-white hover:text-orange-600 w-fit h-full max-h-[53px] px-6 rounded-lg cursor-pointer">
              Send
            </button>
          </div>
        </div>
      )}
      {focus === "notes" && (
        <div className="flex flex-col justify-start items-center w-full grow">
          <div className="w-full grow ">
            <textarea
              name=""
              id=""
              value={notes}
              className="w-full p-5 h-[calc(100vh-200px)] resize-none overflow-y-auto"
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          <div className="w-full h-[80px] flex justify-center items-center px-6 py-2">
            <button className="bg-[#0644EB] text-white hover:bg-white hover:text-[#0644EB] w-full h-full rounded-lg cursor-pointer border border-solid border-[#0644EB] text-2xl cursor-pointer">
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;

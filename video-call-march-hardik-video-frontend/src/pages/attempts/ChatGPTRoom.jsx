import React, { useEffect, useRef, useState } from "react";

const Room = () => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null); // Hold the local stream

  // Setting up peer connection configurations
  const configuration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  // Set up media (audio/video)
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  // Create and configure the peer connection
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(configuration);

    // When a track (video/audio) is received from the remote peer
    peerConnection.addEventListener("track", (event) => {
      console.log("Remote track event:", event);
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    // Handle ICE candidate events
    peerConnection.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        // Send ICE candidate to the remote peer via signaling
        console.log("New ICE candidate:", event.candidate);
      }
    });

    return peerConnection;
  };

  // Start the call (offer)
  const startCall = async () => {
    const localStream = await getUserMedia();
    const peerConnection = createPeerConnection();
    setPeerConnection(peerConnection);
    setIsCallStarted(true);

    // Add local media stream tracks to the peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Create an SDP offer and set it as the local description
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send the offer to the remote peer via signaling
    console.log("Sending offer to remote peer:", offer);
  };

  // Answer the call (answer)
  const answerCall = async (offer) => {
    const localStream = await getUserMedia();
    const peerConnection = createPeerConnection();
    setPeerConnection(peerConnection);
    setIsCallStarted(true);

    // Add local media stream tracks to the peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Set the remote description (offer)
    await peerConnection.setRemoteDescription(offer);

    // Create an SDP answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer to the remote peer via signaling
    console.log("Sending answer to remote peer:", answer);
  };

  // End the call and clean up
  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setIsCallStarted(false);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setRemoteStream(null);
  };

  // Toggle camera on/off
  const toggleCamera = () => {
    const stream = localStreamRef.current;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  // Toggle microphone on/off
  const toggleMic = () => {
    const stream = localStreamRef.current;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [peerConnection]);

  return (
    <div className="flex justify-center items-center flex-col w-screen h-screen">
      {/* Local Video */}
      <div className="w-full h-full flex justify-center items-center">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="max-w-[500px] max-h-[500px]"
        />
      </div>

      {/* Remote Video */}
      {remoteStream && (
        <div className="w-full h-full flex justify-center items-center mt-4">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="max-w-[500px] max-h-[500px]"
          />
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
          <div
            className="h-fit w-fit p-5 bg-green-600 text-white rounded-[22px]"
            onClick={startCall}
          >
            Start Call
          </div>
        ) : (
          <div
            className="h-fit w-fit p-5 bg-red-600 text-white rounded-[22px]"
            onClick={endCall}
          >
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

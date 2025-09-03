import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chat from "../components/Chat";
import Connector from "../components/Connector";
import ReactPlayer from "react-player";
import {
  disconnectSocket,
  listenForICE,
  listenForJoinSuccess,
  sendICE,
} from "../services/socket";
import mic__controls from "../assets/mic__control.svg";
import video__controls from "../assets/video__control.svg";
import end__call from "../assets/end__call.svg";

const Room2 = () => {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(true);

  const [stream, setStream] = useState(null); // state to hold the media stream
  const [remoteStream, setRemoteStream] = useState(null); // state to hold the media stream
  const [isCameraOn, setIsCameraOn] = useState(true); // state to track if camera is on
  const [isMicOn, setIsMicOn] = useState(true); // state to track if camera is on
  const [mediaError, setMediaError] = useState(null); // state to hold any media errors
  const [connection, setConnection] = useState("pending");

  // chat
  const [chats, setChats] = useState(null); // state to hold any media errors
  const [notes, setNotes] = useState(null); // state to hold any media errors

  const isFirstRender = useRef(true); // This will track whether it's the first render
  const isFirstUserRef = useRef(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const generatedOfferRef = useRef(null);
  const remoteSocketRef = useRef(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event) => {
    setDragging(true);
    setOffset({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
  };

  const handleMouseMove = (event) => {
    if (!dragging) return;
    setPosition({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    });
  };

  const handleMouseUp = () => {
    console.log(position);
    setDragging(false);
  };

  const initializePeerConnection = async (stream) => {
    console.log("creating new peer connection");
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        // First set of Google STUN servers
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" },
      ],
    });

    console.log("created new peer connection", peerConnection);

    peerConnectionRef.current = peerConnection;

    console.log("adding event listener for icecandidate");
    // peerConnection.onicecandidate = (event) => {
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate via socket
        // console.log("Sending ICE candidate:", event.candidate);
        // console.log("Broadcasting ICE candidate:", event.candidate);
        sendICE(remoteSocketRef.current, event.candidate);
        // socket.emit("ice-candidate", { to: remoteSocketRef.current, candidate: event.candidate });
      }
    };

    // console.log("adding event listener for iceconnectionstatechange");
    // peerConnection.onnegotiationneeded = async () => {
    //   try {
    //     const offer = await peerConnection.createOffer();
    //     await peerConnection.setLocalDescription(offer);
    //     console.log("Offer created:", offer);
    //     // Send offer via socket
    //   } catch (error) {
    //     console.error("Error creating offer:", error);
    //   }
    // };
    // todo: this is the local stream
    if (stream) {
      console.log("adding tracks");
      stream.getTracks().forEach((track) => {
        // peerConnection.addTrack(track, stream);
        peerConnectionRef.current.addTrack(track, stream);
      });
    } else {
      console.error("No local stream available!");
    }

    console.log("adding event listener for remote track");

    // below code is working
    // peerConnection.ontrack = (event) => {
    // peerConnectionRef.current.ontrack = (event) => {
    //   console.log("Received remote stream:", event.streams[0]);
    //   // Set the remote stream to be displayed in the remote video element
    //   if (remoteVideoRef.current) {
    //     console.log("Setting remote video ref", remoteVideoRef.current);
    //     console.log(
    //       "Setting remote video ref src object",
    //       remoteVideoRef.current.srcObject
    //     );
    //     const [foreignStream] = event.streams;
    //     remoteVideoRef.current.srcObject = foreignStream;
    //     console.log("remoteVideoRef.current is ", remoteVideoRef?.current);
    //     console.log(
    //       "remoteVideoRef.current.srcObject is ",
    //       remoteVideoRef.current.srcObject
    //     );
    //   } else {
    //     console.log("No video ref");
    //   }
    //   console.log("Setting remote video state");
    //   setRemoteStream(event.streams[0]);
    // };

    // below code is an alternative to above code which is also working
    // todo: this is the code by hardik, which is replaced by Anshul.
    peerConnectionRef.current.addEventListener("track", async (ev) => {
      console.log("GOT TRACKS");
      console.log("Track event received:", ev);
      if (ev.streams.length > 0) {
        console.log("setting remote stream", remoteVideoRef);
        if (remoteVideoRef.current) {
          const foreignStream = ev.streams;
          // const foreignStream = new MediaStream();
          // foreignStream.addTrack(ev.track);
          remoteVideoRef.current.srcObject = foreignStream;
          setRemoteStream(foreignStream[0]);
          // remoteVideoRef.current.srcObject = ev.streams[0];
        }
        // console.log(
        //   "remote video ref after set is ",
        //   remoteVideoRef.current.srcObject
        // );
        // console.log("remote stream is ", ev.streams);
        setRemoteStream(ev.streams[0]);
      } else {
        console.warn("No streams found in event.");
      }
    });

    peerConnection.onconnectionstatechange = () => {
      console.log("Peer Connection State:", peerConnection.connectionState);
    };
    // peerConnectionRef.current.addEventListener("track", async (ev) => {
    //   console.log("GOT TRACKS");
    //   console.log("Track event received:", ev);

    //   // Ensure remoteVideoRef is available
    //   if (!remoteVideoRef.current) {
    //     console.warn("Remote video ref is not set yet.");
    //     return;
    //   }

    //   let foreignStream;

    //   // Handle cases where ev.streams is empty (Safari fix)
    //   if (ev.streams.length > 0) {
    //     foreignStream = ev.streams[0];
    //   } else {
    //     console.warn("No streams found in event, manually creating MediaStream.");
    //     foreignStream = new MediaStream();
    //     foreignStream.addTrack(ev.track);
    //   }

    //   // Prevent overwriting MediaStream (track-by-track addition)
    //   if (!remoteVideoRef.current.srcObject) {
    //     remoteVideoRef.current.srcObject = new MediaStream();
    //   }
    //   remoteVideoRef.current.srcObject.addTrack(ev.track);

    //   console.log("Remote stream is:", foreignStream);
    //   console.log("Remote video element after setting stream:", remoteVideoRef.current.srcObject);

    //   // Update React state with a new MediaStream reference to trigger re-render
    //   setRemoteStream(new MediaStream([...foreignStream.getTracks()]));

    //   // Ensure autoplay works in all browsers
    //   try {
    //     console.log("remote video ref is ", remoteVideoRef.current);
    //     await remoteVideoRef.current.play();
    //     console.log("Remote video is playing.");
    //   } catch (error) {
    //     console.error("Error playing remote video:", error);
    //   }
    // });


    console.log(localStorage.getItem("appointmentId"));// vtalix_appointment_105

    // peerConnectionRef.current = peerConnection;

    const offer = await peerConnectionRef.current.createOffer();
    generatedOfferRef.current = offer;
    console.log("generatedRef is ", generatedOfferRef.current);
    console.log("RTC instance is ", peerConnectionRef.current);
  };

  const getDeviceMedia = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError("Your browser does not support camera access.");
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        setStream(newStream);
        localVideoRef.current.srcObject = newStream;
        console.log("Local video ref is ", localVideoRef.current.srcObject);
        console.log("Local video ref is ", localVideoRef.current);
        setIsCameraOn(true);
        initializePeerConnection(localVideoRef.current.srcObject);
      }
      setMediaError(null); // Clear error if successful
      console.log("Media stream received.");
    } catch (err) {
      console.error("Media access error:", err);
      if (err.name === "NotAllowedError") {
        setMediaError(
          "Camera access is blocked. Please allow camera and microphone in browser settings or refresh the page."
        );
      } else if (err.name === "NotFoundError") {
        setMediaError("No camera or microphone found on this device.");
      } else {
        setMediaError("Failed to access media devices. Try again.");
      }
    }
  };

  // will toggle the camera(Anshul Sir)
  /* 
   const toggleCamera = () => {
     if (stream) {
       const videoTrack = stream.getVideoTracks()[0];
       if (videoTrack) {
         if (isCameraOn) {
           videoTrack.stop(); // Completely stop the camera
           localVideoRef.current.srcObject = null; // Remove video feed
           // const invertRef = !isCameraref.current;
           // isCameraref.current = invertRef;
           setIsCameraOn(false);
         } else {
           getDeviceMedia(); // Restart the camera
         }
       }
     }
   };
  */

  // Function to toggle the microphone(Hardik)
  const toggleCamera = () => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !videoTrack.enabled;
      videoTrack.enabled = newState;
      setIsCameraOn(newState);
    }
  };

  // const toggleCamera = async () => {
  //   if (!localStream) return;

  //   // Get the current video track
  //   const videoTrack = localStream.getVideoTracks()[0];

  //   if (videoTrack) {
  //     videoTrack.stop(); // Stop the current track
  //     localStream.removeTrack(videoTrack);
  //   }

  //   // Get a new video stream (e.g., switch between front and back camera)
  //   const newStream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //   });
  //   const newVideoTrack = newStream.getVideoTracks()[0];

  //   // Add new track to the peer connection
  //   localStream.addTrack(newVideoTrack);
  //   peerConnection.addTrack(newVideoTrack, localStream);

  //   // **Manually trigger renegotiation**
  //   const offer = await peerConnection.createOffer();
  //   await peerConnection.setLocalDescription(offer);

  //   // Send offer to the other peer
  //   sendSignalToPeer({ type: "offer", sdp: offer });
  // };

  // Function to toggle the microphone
  const toggleMic = () => {
    const audioTrack = stream?.getAudioTracks()[0];
    if (audioTrack) {
      const newState = !audioTrack.enabled;
      audioTrack.enabled = newState;
      setIsMicOn(newState);
    }
  };

  const endCall = () => {
    console.log("Ending call...");

    // Stop all media tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    // Close the peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onsignalingstatechange = null;

      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear the video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Notify backend about disconnect
    console.log("Emitting disconnect event to backend...");
    // userLeft();
    disconnectSocket();

    // Navigate back to the home page
    // navigate("/");
  };

  const renderConnectionState = () => {
    switch (connection) {
      case "pending":
        return (
          <button
            className="w-fit h-fit px-6 py-2 bg-[#0644EB] text-white rounded-full hover:bg-white hover:text-[#0644EB]"
            onClick={() => setConnection("connecting")}
          >
            JOIN
          </button>
        );
      case "connecting":
        return (
          <h1>
            <Connector
              setConnection={setConnection}
              generatedOfferRef={generatedOfferRef}
              peerConnectionRef={peerConnectionRef}
              remoteVideoRef={remoteVideoRef}
              remoteSocketRef={remoteSocketRef}
            />
          </h1>
        );
      case "connected":
        return (
          <video
            // ref={remoteStream}
            // change max-h and max-w in future
            className="scale-x-[-1] h-full w-full object-contain max-h-fit max-w-fit"
            playsInline
            ref={remoteVideoRef}
            autoPlay
          />
        );
      default:
        return <h1>Unknown Stage</h1>;
    }
  };

  useEffect(() => {
    console.log("re-rendering on entire component mount");

    let controlsHeight = 175; // Default height of controls div (update if different)
    if (window.innerWidth < 1280) controlsHeight = 80;
    console.log("window innerwidth is", window.innerWidth);
    console.log("window innerheight is", window.innerHeight);
    setPosition({
      x: window.innerWidth - 850,
      y: window.innerHeight - controlsHeight - 295,
    });
    // less than 1280 one is perfect, change in the future
    // increasing negation in width result in moving to left side of the screen
    // increasing negation in height result in moving to up side of the screen
    if (window.innerWidth < 900)
      setPosition({
        x: window.innerWidth - 850,
        y: 315,
      });
    // if (window.innerWidth < 1280)
    //   setPosition({
    //     x: window.innerWidth - 700,
    //     y: window.innerHeight - controlsHeight - 225,
    //   });
    if (window.innerWidth < 1440)
      setPosition({
        x: window.innerWidth - 1150,
        y: window.innerHeight - controlsHeight - 205,
      });
    // if (window.innerWidth < 1920)
    //   setPosition({
    //     x: window.innerWidth - 700,
    //     y: window.innerHeight - controlsHeight - 225,
    //   });
    // if (window.innerWidth >= 1920)
    //   setPosition({
    //     x: window.innerWidth - 700,
    //     y: window.innerHeight - controlsHeight - 225,
    //   });

    // close chat for smaller devices
    if (window.innerWidth < 1280) setChatOpen(false);
    console.log("position is ", position);

    // **comment below code (before getUserMedia) for preventing navigation on every re-render**
    // if (!isFirstRender.current) {
    //   // This will run only on subsequent renders, not on the first render
    //   navigate("/"); // Navigate to the base URL
    // } else {
    //   isFirstRender.current = false; // Mark the first render as done
    // }
    getDeviceMedia();

    listenForICE(async (data) => {
      console.log("Received ICE candidate:", data);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data)
        );
      }
    });

    return () => {
      // Clean up the stream when component unmounts
      // **comment below code for preventing navigation on every re-render**
      endCall();
    };
  }, []);

  /* 
   useEffect(() => {
     if (peerConnectionRef.current) {
       peerConnectionRef.current.addEventListener("track", async (ev) => {
         console.log("Track event received:", ev);
         if (ev.streams.length > 0) {
           console.log("setting remote stream", remoteVideoRef.current);
           if(remoteVideoRef.current) {
           }
           remoteVideoRef.current = ev.streams[0];
           console.log("remote video ref is ", remoteVideoRef.current);
           console.log("is Video being mounted", connection === "connected");
           setConnection("connected");
           console.log("is Video being mounted", connection === "connected");
           setRemoteStream(ev.streams[0]); // Make sure state is updated
         } else {
           console.warn("No streams found in event.");
         }
       });
     } else {
       console.warn("Peer connection is not initialized yet.");
     }
   }, [peerConnectionRef.current]); // Add dependency to re-run when peerConnectionRef.current is set
  */

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex justify-start items-center w-screen h-screen bg-[#F9F4F1] p-1 rounded-xl overflow-hidden">
      {/* Chat */}
      {chatOpen && (
        <div className="w-full lg:max-w-[409px] xl:max-w-[729px] h-full">
          <Chat
            chats={chats}
            setChats={setChats}
            notes={notes}
            setNotes={setNotes}
          />
        </div>
      )}

      {/* Video */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="grow h-full flex flex-col items-center justify-start relative"
      >
        {/* remote-video */}
        <div className="grow w-full bg-[#2B2B3A] flex flex-col justify-center items-center">
          {/* {renderConnectionState()} */}
          {connection === "pending" && (
            <div className="w-full h-fit flex justify-center items-center">
              <button
                className="mx-auto w-fit h-fit px-6 py-2 bg-[#0644EB] text-white rounded-full cursor-pointer hover:bg-white hover:text-[#0644EB]"
                onClick={() => setConnection("connecting")}
              >
                JOIN
              </button>
            </div>
          )}

          {connection === "connecting" && (
            <h1>
              <Connector
                setConnection={setConnection}
                generatedOfferRef={generatedOfferRef}
                peerConnectionRef={peerConnectionRef}
                remoteVideoRef={remoteVideoRef}
                remoteSocketRef={remoteSocketRef}
              />
            </h1>
          )}
          {/* {connection === "connected" && (
            <video
            // ref={remoteStream}
            // change max-h and max-w in future
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="scale-x-[-1]"
            // className="scale-x-[-1] h-full w-full object-contain max-h-fit max-w-fit"
          />
          )} */}
          <div className="h-full w-full flex justify-center items-center">
            {/* do not conditionally mount video tag or remoteVideoRef will be undefined */}
            {/* JSX and hooks get define before useEffect takes place , conditionally mounting video tag only after connected state will result in a bug where remoteVideoRef will remain undefined and its srcObject would not get any value assigned to it */}
            <ReactPlayer
              // ref={remoteStream}
              // change max-h and max-w in future
              // ref={remoteVideoRef.current? remoteSocketRef}
              // src={remoteVideoRef?.current?.srcObject}
              url={remoteStream}
              autoPlay
              playsInline
              // className="scale-x-[-1] bg-red-600 w-full h-full"
              className="scale-x-[-1] h-full w-full object-contain max-h-fit max-w-fit"
            />
          </div>
        </div>

        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: dragging ? "grabbing" : "grab",
          }}
          className={`absolute bottom-20 xl:bottom-[175px] right-6 w-[276px] xl:w-96 min-h-[207px] max-h-fit h-[207px] rounded-4xl overflow-hidden text-black`}
        >
          <video
            draggable="false"
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="scale-x-[-1]"
          />
        </div>

        {/* Controls */}
        <div
          className={`w-full  ${connection === "connected" ? "bg-green-600" : "bg-[#9DA5B8]"
            } h-[80px] xl:h-[150px] flex justify-center items-center gap-12`}
        >
          <div
            className={`xl:h-[75.5px] xl:w-[75.5px] p-5 rounded-full cursor-pointer ${isMicOn ? "bg-white" : " bg-red-600"
              }`}
            onClick={() => toggleMic()}
          >
            <img src={mic__controls} alt="" className="w-full h-full" />
          </div>
          <div
            className={`h-fit w-fit p-5 bg-red-600 text-white rounded-[22px] cursor-pointer`}
            onClick={() => endCall()}
          >
            <img src={end__call} alt="" className="w-full h-full" />
          </div>
          <div
            className={`xl:h-[75.5px] xl:w-[75.5px] text-red-600 p-5 rounded-full cursor-pointer ${isCameraOn ? "bg-white" : " bg-red-600"
              }`}
            onClick={() => toggleCamera()}
          >
            <img src={video__controls} alt="" className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room2;

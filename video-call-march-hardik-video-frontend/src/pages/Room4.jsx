import { useCallback, useEffect, useRef, useState } from "react";
import iceServers from "../store/iceServer";

import mic__controls from "../assets/mic__control.svg";
import video__controls from "../assets/video__control.svg";
import end__call from "../assets/end__call.svg";
import { useNavigate } from "react-router-dom";

import { connectSocket, listenForJoinSuccess, listenForAnswer, listenForOffer, joinRoom, sendOffer, sendAnswer } from "../services/socket";
import ReactPlayer from "react-player";

const Room4 = () => {
  try {
    const navigate = useNavigate();

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const isFirstRenderRef = useRef(1);

    let localStream;
    
    let peerCon = useRef();
    let myRole = localStorage.getItem("role");// used for chat
    const [remoteStream, setRemoteStream] = useState();
    let implicitAddition = false;// in January VC, tracks and dataChannels were added from a single side
    console.log("peer con is ", peerCon);

    const [peer, setPeer] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [stream, setStream] = useState();
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [focus, setFocus] = useState("chat");
    const [stage, setStage] = useState("Please Wait...");


    const isCameraref = useRef();
    const remoteSocketRef = useRef();

    const getUserMediaDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaError("Your browser does not support camera access.");
        return;
      }

      try {
        console.log("localRef is", localVideoRef.current);
        console.log("navigator is ", navigator.mediaDevices);
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          // localStream = newStream;
          console.log("localStream is ", localStream);
          // localVideoRef.current.srcObject = new MediaStream([localStream]);
          localVideoRef.current.srcObject = localStream;
          console.log("Local video ref srcObject is ", localVideoRef.current.srcObject);
          console.log("Local video ref is ", localVideoRef.current);
          // initializePeerConnection(localVideoRef.current.srcObject);
        }
        setStream(localStream);
        // Get the element by its ID
        setMediaError(null); // Clear error if successful
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

    const initializePeerConnection = async () => {

      console.log("peerCon before intialize ", peerCon);
      peerCon.current = new RTCPeerConnection({
        iceServers: iceServers
      })
      console.log("peer connection is ", peerCon.current);

      peerCon.current.onicecandidate = (event) => {
        // console.log("event is ", event);
        // console.log("event.candidate is ", event.candidate);
        if (event.candidate) {
          // Send ICE candidate via socket
          // console.log("Sending ICE candidate:", event.candidate);
          // console.log("Broadcasting ICE candidate:", event.candidate);
          //   sendICE(remoteSocketRef.current, event.candidate);
          // socket.emit("ice-candidate", { to: remoteSocketRef.current, candidate: event.candidate });
        }
      };

      /* 

       if(!implicitAddition){
         console.log("adding tracks explicitly", localVideoRef.current);
       // Push tracks from local stream to peer connection
       localVideoRef.current.srcObject.getTracks().forEach((track) => {
         peerCon.addTrack(track, localStream);
       });
       }
      
      */

      
     // Pull tracks from remote stream, add to video stream
     
     peerCon.current.ontrack = (event) => {
      console.log("onTrack function");
       console.log("event in onTrack is ", event);
       console.log("event.streams is ", event.streams);
       const foreignStream = event.streams[0];
       console.log("foregign stream is ", foreignStream);
       event.streams[0].getTracks().forEach((track) => {
         console.log("========================================================================");
         console.log("track is ", track);
         console.log("========================================================================");
         remoteVideoRef.current.srcObject.addTrack(track);
       });
     };

      peerCon.current.addEventListener("track", (ev) => {
        console.log("event is ", ev);
        console.log("event.streams is ", ev.streams);
        const foreignStream = ev.streams;
        console.log("remote streams is ", foreignStream[0]);
        remoteVideoRef.current.srcObject = new MediaStream(foreignStream[0]);
        setRemoteStream({...foreignStream[0]});
        setStage("Connected");
      });

      peerCon.current.addEventListener("tracks", (ev) => {
        console.log("this is fir tracks");
        console.log("event is ", ev);
        console.log("event.streams is ", ev.streams);
        const foreignStream = ev.streams;
        console.log("remote streams is ", foreignStream[0]);
        remoteVideoRef.current.srcObject = new MediaStream(foreignStream[0]);
        setRemoteStream({...foreignStream[0]});
        setStage("Connected");
      });

      peerCon.current.onconnectionstatechange = () => {
        // console.log("Peer Connection State:", peerCon.connectionState);
      };

      console.log("peerCon after intialize ", peerCon.current);
      if(peerCon !== undefined){
        console.log("peer COnn is", peerCon.current);
        setPeer(true);
      }
      console.log("peer connection intialiazed, calling user");

    }

    

    // Function to toggle the microphone
    const toggleMic = () => {
      const audioTrack = stream?.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setIsMicOn(newState);
      }
    };

    // todo: this function is working as expected until further updates for the tracks
    const toggleCamera = () => {
      console.log("inside toggle Camera", typeof localStream);
      // const videoTrack = localStream.getVideoTracks()[0];
      // console.log("videoTrack is ", videoTrack);
      console.log("condition 1 ", !!localStream);
      console.log("condition 2 ", typeof localStream !== undefined);
      console.log("condition 3 ", !!localStream && (typeof localStream !== undefined));
      if (localStream && typeof localStream !== undefined) {
        const videoTrack = localStream.getVideoTracks()[0];
        console.log("video track is ", videoTrack);
        if (videoTrack) {
          console.log("gonna switch off");
          console.log("camera ref.current is", localVideoRef.current);
          if (localVideoRef.current.srcObject) {
            console.log("aa gya andar");
            videoTrack.stop(); // Completely stop the camera
            localVideoRef.current.srcObject = null; // Remove video feed
            const invertRef = !isCameraref.current;
            isCameraref.current = invertRef;
            setIsCameraOn(false);
            console.log("local stream is ", localStream);
            console.log("=================================localRefPresentStarts========================================");
            console.log("yahan last h");

            console.log("condition 1 ", !!localStream);
            console.log("condition 2 ", typeof localStream !== undefined);
            console.log("condition 3 ", !!localStream && (typeof localStream !== undefined));
            console.log("=================================localRefPresentEnds========================================");
          } else {
            console.log("getting user media");

            getUserMediaDevices(); // Restart the camera
            setIsCameraOn(true);
          }
        }
      } else {
        console.log("gonna switch on");

        getUserMediaDevices(); // Restart the camera
        setIsCameraOn(true);
      }
    };

    const getOffer = async () => {
      const offer = await peerCon?.current?.createOffer();
      return offer;
    }

    const getAnswer = async () => {
      const answer = await peerCon?.current.createAnswer();
      return answer;
    }

    const sendStreams = () => {
        
      console.log("adding tracks...", peerCon?.current);
      if(!peerCon) return;
      
      if (stream) {
        for (const track of stream.getTracks()) {
          peerCon?.current?.addTrack(track, stream);
        }
      }
      console.log("peer tracks is ", peerCon.current);
    };

    const callPeer = async () => {
      console.log("peerCon in call peer is ", peerCon);
      const offer = await getOffer();
      await peerCon?.current.setLocalDescription(offer);
      const appointment_id = localStorage.getItem("appointmentId");
      const token = localStorage.getItem("token");
      const remoteSocketId = remoteSocketRef.current;
      
      console.log("appointment ID is", appointment_id, "token is ", token);
      console.log("remote Socket ID i s", remoteSocketRef.current)
      console.log("offer is ", offer);
      
      sendOffer(appointment_id, token, offer, remoteSocketId);
    }

    const answerPeer = async (data) => {
      console.log("incomming offer", data);
      const final_peer = await peerCon?.current.setRemoteDescription(data.offer);
      console.log("final peer is ", final_peer);
      const answer = await getAnswer();
      const final_peer2 = await peerCon?.current?.setLocalDescription(answer);
      console.log("final peer 2 is ", final_peer2);
      remoteSocketRef.current = data.from;

      const appointment_id = localStorage.getItem("appointmentId");
      const token = localStorage.getItem("token");
      const remoteSocketId = remoteSocketRef.current;

      sendAnswer(appointment_id,token , answer, remoteSocketId);
      console.log("sent Answer", answer);
      setStage("Connected");
      console.log("peerCon in answer is ", peerCon);
    }

    const acceptPeer = async (data) => {
      console.log("accepting peer", data);
      await peerCon?.current?.setRemoteDescription(data.answer);
      console.log("implicit Addition is ", implicitAddition);
      if(implicitAddition){
        console.log("adding track implicitly");
        // add Tracks
        // Push tracks from local stream to peer connection

      console.log("local stream in implicit is ", localStream);
      console.log("local stream ref in implicit is ", localVideoRef.current.srcObject);
        localStream.getTracks().forEach((track) => {
          peerCon?.current.addTrack(track, localVideoRef.current.srcObject);
        });
      }
      setStage("Connected");
      console.log("peer con in accept peer is ", peerCon);
      sendStreams();
    }

    const startCall = async () => {
      console.log("peer connection intialiazed, calling user");
      setStage("Joining...");
      connectSocket();
      const appointment_id = localStorage.getItem("appointmentId");
      const token = localStorage.getItem("token");
      console.log("appointment Id ", appointment_id, "token is ", token);
      joinRoom(appointment_id, token)
    }

    const handleJoinSuccess = async (data) => {
      console.log("joined room successfully", data);
      setStage("Waiting for other User");
      const isFirst = !!(data.offer === null && data.remoteSocket === null);// change to checking if there was remote Socket ID or offer or not
      console.log("is First", isFirst);
      if(isFirst){
        console.log("listening for offer");
        await listenForOffer(answerPeer);
      }else{
        console.log("sending offer and listening for answer");
        remoteSocketRef.current = data.remoteSocket;
        callPeer();
        await listenForAnswer(acceptPeer);
      }
    }

    useEffect(() => {
      listenForJoinSuccess(handleJoinSuccess);
    }, [])

    const saveNotes = () => {
      console.log("dispatch save Notes");
      alert("dispatch save Notes");
    }

    const saveChats = () => {
      console.log("dispatch Save Chats");
      // alert("dispatch Save Chats");
    }

    const endCall = () => {
      console.log("Ending call...");

      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }

      // Close the peer connection
      if (peerCon) {
        peerCon.current.ontrack = null;
        peerCon.current.onicecandidate = null;
        peerCon.current.oniceconnectionstatechange = null;
        peerCon.current.onsignalingstatechange = null;

        peerCon.close();
        peerCon = null;
      }

      // if (dataChannelRef.current) {
      //   dataChannelRef.current.close();
      //   dataChannelRef.current = null;
      // }

      // Clear the video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Notify backend about disconnect
      console.log("Emitting disconnect event to backend...");
      // userLeft(remoteSocketRef.current);
      // Cleanup event listeners
      // listenForJoinSuccess(null);
      // listenForAnswer(null);
      // listenForOffer(null);
      // disconnectSocket();

      saveChats();
      setStage("Join");

      // Navigate back to the home page
      // navigate("/");
    };

    // checking if stream changes frequently
    useEffect(() => {
      if (typeof stream !== undefined) {
        console.log("Stream from useEffect is ", stream);
      }
    }, [stream])

    useEffect(() => {
      console.log("mounting");
      const new_fn = async () => {
        await getUserMediaDevices();
        await initializePeerConnection();
        await startCall();
      }
      new_fn();
      return () => {
        console.log("unmounting");
        endCall();
      }
    }, []);

    useEffect(() => {

      console.log("Component Mountn s");
      if(isFirstRenderRef.current === 1){
        isFirstRenderRef.current = 2;
        return;
      }else{
        console.log("re rendering");
        alert("Component re rendered");
      }
    }, [])


    return (<>
      <div className="h-screen w-screen p-2 flex justify-center items-center bg-[#F9F4F1] overflow-hidden">

        {/* Chat and Notes below */}
        <div
          className={`w-[409px] 2xl:w-[729px] hidden h-full lg:flex flex-col justify-between overflow-y-hidden p-4`}
        >

          {/* Chat and Notes Toggler */}
          <div className="flex justify-start items-center w-full pt-8 pb-3 pl-6 gap-8 border border-solid border-x-0 border-t-0 border-b-1 border-[#E1DEDA]">
            <button
              className={`cursor-pointer ${focus === "chat" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent text-black"
                } border-b-2`}
              onClick={() => setFocus("chat")}
            >
              <p className="text-2xl font-medium">Chat</p>
            </button>

            <button
              className={`cursor-pointer ${focus === "notes" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent text-black"
                } border-b-2`}
              onClick={() => setFocus("notes")}
            >
              {/* <span className="hidden 2xl:block">Consultation</span> Notes */}
              <p className="text-2xl font-medium">Consultation Notes</p>
            </button>
          </div>

          {/* Chat and Notes Content */}
          <div className="grow w-full p-5 flex justify-center items-end">
            {
              focus === "chat" && (
                <>
                  chats
                </>
              )
            }
            {
              focus === "notes" && (
                <>
          <div className="w-full grow p-2">
            <textarea
              className="w-full h-[calc(100vh-250px)] p-5 resize-none overflow-y-auto border border-gray-300 rounded-md text-2xl"
              // value={notes}
              // onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          </>
              )
            }
          </div>

          {/* Chat and Notes input */}
          <div className="h-fit w-full p-1 flex justify-center items-end">
            {
              focus === "chat" && (
                <>
                  <button className="rounded-xl bg-blue-600 px-6 py-2 w-full hover:bg-white hover:text-blue-600 border border-solid border-blue-600">
                    Save Chat
                  </button>
                </>
              )
            }
            {
              focus === "notes" && (
                <>
                  <button 
                  className="rounded-xl bg-blue-600 text-white px-6 py-4 w-full hover:bg-white hover:text-blue-600 border border-solid border-blue-600"
                  onClick={() => saveNotes()}
                  >
                    Save Notes
                  </button>
                </>
              )
            }
          </div>

        </div>

        {/* Video Call Below */}
        <div className="grow bg-[#2B2B3A] h-full flex flex-col justify-start items-start relative">
          <div className="grow w-full flex flex-col justify-start items-center">
            {mediaError && <>{mediaError}</>}

            {/* remote stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="scale-x-[-1] h-full w-full"
            />
            {/* <ReactPlayer 
            url={remoteStream}
            autoPlay
            playsinline
            height="100%"
            width="100%"
            /> */}
            {/* <video autoPlay src={{remoteStream}} className="h-full w-full bg-red-900">{console.log("remoteStream in video tag is ", remoteStream)}</video> */}
            
            
          </div>
          
          {/* own stream */}
          <div
            className={`absolute bottom-28 2xl:bottom-[175px] right-6 w-[276px] 2xl:w-96 min-h-[207px] max-h-fit h-[207px] rounded-4xl overflow-hidden bg-black text-white`}
          >
            <video
              // draggable="false"
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="scale-x-[-1]"
              // src={localStream}
              // id="local-video"
            />
            {/* <ReactPlayer 
            url={stream}
            height="100%"
            width="100%"
            playing
            playsinline
            muted
            /> */}
          </div>

        {/* Joiner */}
        {peer && stage !== "Connected" && (
          <div
            className={`absolute top-6 left-5 rounded-lg w-fit h-fit overflow-hidden bg-[#2B2B3A] text-white`}
          >
            <button className={`bg-blue-600 px-6 py-2 rounded-lg cursor-not-allowed min-w-[150px] text-xl font-normal`}
            >{stage}</button>
          </div>
          )}
        {peer && stage === "Connected" && (
          <div
            className={`absolute top-6 left-5 rounded-lg w-fit h-fit overflow-hidden bg-[#2B2B3A] text-white`}
          >
            <button className={`bg-blue-600 px-6 py-2 ${stage === "Connected" ? "rounded-full cursor-pointer" : "rounded-lg cursor-not-allowed"} min-w-[150px] text-xl font-normal`}
            onClick={()=>sendStreams()}
            >Join Meeting</button>
          </div>
          )}

          {/* Controls of Video Call Below */}
          <div
            className={`w-full bg-[#9DA5B8] h-[80px] 2xl:h-[150px] flex justify-center items-center gap-12`}
          >
            <button
              className={`2xl:h-[75.5px] 2xl:w-[75.5px] p-5 rounded-full cursor-pointer ${isMicOn ? "bg-white" : " bg-red-600"
                }`}
              onClick={() => toggleMic()}
            >
              <img src={mic__controls} alt="" className="w-full h-full" />
            </button>
            
            <button
              className={`h-fit w-fit p-5 bg-red-600 text-white rounded-[22px] cursor-pointer`}
              onClick={() => endCall()}
            >
              <img src={end__call} alt="" className="w-full h-full" />
            </button>
            
            <button
              className={`2xl:h-[75.5px] 2xl:w-[75.5px] text-red-600 p-5 rounded-full cursor-pointer ${isCameraOn ? "bg-white" : " bg-red-600"
                }`}
              onClick={() => toggleCamera()}
            >
              <img src={video__controls} alt="" className="w-full h-full" />
            </button>
          </div>
        </div>
      </div>
    </>);
  } catch (error) {
    console.log("error is ", error);
  }
}

export default Room4;
import { useEffect, useRef, useState } from "react";
import { connectSocket, joinRoom, listenForJoinSuccess, sendOffer, listenForAnswer, listenForErrors, listenForOffer, sendAnswer, sendICE, listenForICE, disconnectSocket, listenForUserLeft, resetSockets } from "../services/socket";

import mic__controls from "../assets/mic__control.svg";
import video__controls from "../assets/video__control.svg";
import end__call from "../assets/end__call.svg";
import { useNavigate } from "react-router-dom";

const ThirdRoom = ({ end_time })=>{
    const userVideo = useRef(); // for passing in video tag
    const remoteVideo = useRef(); // for passing in video tag
    const peerRef = useRef(); // for peer
    const socketRef = useRef(); // for Socket emits and ons
    const otherUser = useRef(); //  for remoteSocketID
    const userStream = useRef(); //  for addTrack
    const isFocusRef = useRef(true);

    const sendChannel = useRef();
    const [text, setText] = useState();
    const [isPartnerVideoActive, setIsPartnerVideo] = useState(true);
    const [partnerName, setPartnerName] = useState();
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState(false);

    // Reference to the message container
  const messagesEndRef = useRef(null);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // This effect runs when messages change
    
    const appointment_id = localStorage.getItem("appointmentId");
    const token = localStorage.getItem("token");
    
    const userId = useRef();
    let new_socket;

    const receivedICECandidates = useRef(new Set());
    const [receivedICECandidatesState, setReceivedICECandidatesState] = useState(new Set()); 
    const [focus, setFocus] = useState("chat");
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [signalingState, setSignalingState] = useState(null);

    // Monitor and update signaling state
    useEffect(() => {
      const interval = setInterval(() => {
        const currentState = peerRef?.current?.signalingState;
        if (currentState !== signalingState) {
          setSignalingState(currentState);
        }
      }, 100); // or on some RTC events if available
    
      return () => clearInterval(interval);
    }, [signalingState]);

    useEffect(() => {
      // The provided end time string (e.g., "23:30")
      console.log("End_time is ", end_time.current);
      const endTime = end_time.current;
      console.log("endTime is ", endTime);
      if(!endTime) return;
  
      // Parse the hours and minutes from the endTime string
      const [hours, minutes] = endTime?.split(":")?.map(Number);
  
      // Create a Date object for today's date at the provided time (e.g., 23:30)
      const now = new Date();
      const endDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours, minutes, 0, 0
      );
  
      const interval = setInterval(() => {
        const currentTime = new Date();
  
        // Check if current time is between the target time and 1 minute after
        if (currentTime >= endDateTime) {
          console.log("Times up");
          endCall(); // Call your function
        }
      }, 1000); // check every second
  
      return () => clearInterval(interval); // Clean up the interval on unmount
    }, []);

    const navigate= useNavigate();

    
    const handleJoinSuccess = async (data) => {
        console.log("joined room successfully ", data);
        setPartnerName(data?.opponent_name);
        userId.current = data.socketId;
        // setStage("Waiting for other User");
        const isFirst = !!(data.remoteSocket === null);// change to checking if there was remote Socket ID or offer or not
        console.log("is First", isFirst);
        if (isFirst) {
            console.log("listening for offer");
            await listenForOffer(answerPeer);
        } else {
            console.log("sending offer and listening for answer");
            otherUser.current = data.remoteSocket;
            callPeer();
            // await listenForAnswer(acceptPeer);
        }
    }

    const answerPeer = (incoming)=>{
      console.log("================================================answer peer function================================================");
      otherUser.current = incoming.from;
      console.log("incoming from is ", incoming.from);
      console.log("remote ID is ", otherUser.current);
      peerRef.current = createPeer();
      peerRef.current.ondatachannel = (event) => {
        sendChannel.current = event.channel;
        sendChannel.current.onmessage = handleReceiveMessage;
      }
      console.log("incoming answer is ", incoming);
      console.log("peer.current in answer peer is ", peerRef.current);
      const desc = new RTCSessionDescription(incoming.offer);
      peerRef.current?.setRemoteDescription(desc).then(() => {
          userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
      }).then(() => {
          return peerRef.current?.createAnswer();
      }).then(answer => {
          peerRef.current?.setLocalDescription(answer);
          return answer;
      }).then((answer) => {
          console.log("================================================answer function ends================================================");
          sendAnswer(appointment_id, token, answer, incoming.from); 
      })
    }
    
    const handleAnswer = async (message)=> {
      if(!peerRef.current){
        console.log("❌ Peer Connection is not initialized yet!");
        return;
      }
      console.log("i'm handle Answer");
      console.log("message received is ", message);
      const desc = new RTCSessionDescription(message?.answer);
      console.log("Description is ", desc);
      console.log("peerRef is ", peerRef?.current);
      await peerRef?.current?.setRemoteDescription(desc).catch(e => console.log(e));
      console.log("peer ref in handle answer is ", peerRef.current);
    }

    const handleTrackEvent = (e) => {
      console.log("Track event received! Waiting for remote video...");
    
      const waitForRemoteVideo = setInterval(() => {
        console.log("Runs even after clear Interval 1 if after remote Video set");
        console.log("src of video is outside ", remoteVideo.current.srcObject);
        if (remoteVideo.current) {
          console.log("remote video.current is ", remoteVideo.current);
          remoteVideo.current.srcObject = e.streams[0];
          console.log("src of video is ", remoteVideo.current.srcObject);
          console.log("✅ Remote video set!");
          clearInterval(waitForRemoteVideo);
        }        
        console.log("remote video.current is 2", remoteVideo.current || "Nil");
      }, 100);
    };

    const handleNewICECandidateMsg = (incoming)=> {
        console.log("i'm handleIceMessage with soket id as ", incoming);
        // return;
        const candidate = new RTCIceCandidate(incoming);
        console.log("peer ref in handleIceCandidate is ", peerRef.current);

        peerRef.current?.addIceCandidate(candidate)
            .then(() => {
                console.log("✅ ICE candidate added successfully:", candidate);
                console.log("Updated Peer Connection:", peerRef.current);
            })
            .catch(e => {console.log("error in hadnnle ice candidate is ",e)});
        console.log("Receivers after ICE candidate:", peerRef.current.getReceivers());


        console.log("ICE cancidate set ", peerRef?.current);
    }

    const endCall = () => {
      console.log("Ending call...");

      // Stop all media tracks
      if (userStream.current) {
        userStream?.current?.getTracks()?.forEach((track) => track.stop());
      }
      console.log("Stopped local stream ", remoteVideo.current?.srcObject);
      

      if (remoteVideo.current) {
        remoteVideo?.current?.srcObject?.getTracks()?.forEach((track) => track?.stop());
      }

      if (userVideo.current) {
        userVideo?.current?.srcObject?.getTracks()?.forEach((track) => track?.stop());
      }
      console.log("Stopped local stream 2");

      // Close the peer connection
      if (peerRef?.current) {
        peerRef.current.ontrack = null;
        peerRef.current.onicecandidate = null;
        peerRef.current.oniceconnectionstatechange = null;
        peerRef.current.onsignalingstatechange = null;
        peerRef.current.close();
        // peerRef.current = null;
      }

      console.log("Made peer null");
      console.log("Made peer null ", peerRef?.current);

      // if (dataChannelRef.current) {
      //   dataChannelRef.current.close();
      //   dataChannelRef.current = null;
      // }

      // Clear the video elements
      if (userVideo?.current) {
        console.log("setting the userVideo.current to null");
        userVideo.current.srcObject = null;
      }
      console.log("Making source of local video element null")
      console.log("Making source of local video element null ", userVideo?.current?.srcObject);

      if (remoteVideo?.current) {
        console.log("setting the remoteVideo.curret to null");
        remoteVideo.current.srcObject = null;
      }
      console.log("Making source of remote video element null")
      console.log("Making source of remote video element null ", remoteVideo?.current?.srcObject);

      // Notify backend about disconnect
      console.log("Emitting disconnect event to backend...");
      // userLeft(remoteSocketRef.current);
      // Cleanup event listeners
      resetSockets();
      console.log("disconnecting socket");
      disconnectSocket();
      console.log("Emitting disconnect socket")

      saveChats();

      // Navigate back to the home page
      console.log("Navigating");
      navigate("/");
    };

    useEffect(()=>{
      console.log("Starting with getting user Media");
      navigator?.mediaDevices?.getUserMedia({
            video: true,
            audio: true,
        })
        .then(async (stream)=>{
            // taking the permission from the user's browser and setting the local stream in the video tag
            userVideo.current.srcObject = stream;
            userStream.current = stream;
            
            new_socket = connectSocket();
            const checkSocketId = async () => {
              while (!new_socket?.id) {
                await new Promise((resolve) => setTimeout(resolve, 10)); // Retry until socket ID is available
              }
              userId.current = new_socket.id;
              console.log("Your Socket ID:", new_socket.id);
            };
        
            await checkSocketId();
            console.log("printing after we get our own ID ", userId.current);

            // now we will hit the join room
            joinRoom(appointment_id, token);
            listenForJoinSuccess(handleJoinSuccess);
            listenForICE(handleNewICECandidate);
            listenForUserLeft(endCall);
            listenForErrors(endCall);
        });
    }, []);

    const handleReceiveMessage = (e) => {
      setMessages(messages => [...messages, {isMe: false, message: e.data}]);
      if(isFocusRef.current === false){
        setNewMessage(true);
      }
    }

    const callPeer = ()=>{
      peerRef.current = createPeer(userId.current);
      console.log("Peer Ref is ", peerRef.current);
      console.log("all track sare ", userStream.current.getTracks());
      userStream?.current?.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
      console.log("peerRef is ", peerRef.current);
      sendChannel.current = peerRef.current.createDataChannel("sendChannel");
      sendChannel.current.onmessage = handleReceiveMessage;
    }

    const createPeer = (id)=>{
      console.log("call peer function callled", otherUser);
      const peer = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.stunprotocol.org" },
            { urls: "stun:stun3.l.google.com:5349" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:5349" },
        ]
      });
      peer.onicecandidate = handleICECandidateEvent;
      peer.ontrack = handleTrackEvent;
      peer.onnegotiationneeded = () => {
        console.log("sending offer auto");
        handleNegotiationNeededEvent(id)
      };
      peer.oniceconnectionstatechange = () => {
        console.log("🔄 ICE Connection State:", peerRef.current.iceConnectionState);
      
        if (peer.iceConnectionState === "connected") {
          console.log("✅ Connection stabilized! Sending last ICE candidate...");
        }
      };

      return peer;
    }

    const handleNegotiationNeededEvent = (id)=>{
      peerRef.current.createOffer().then(offer => {
        console.log("offer is ", offer);
        peerRef.current.setLocalDescription(offer);
        return(offer);
      }).then((offer) => {
        console.log("sdp is ", offer);
        console.log("appointment ID is ", appointment_id);
        console.log("offer is ", offer);
        console.log("remoteSocket is ", otherUser.current);
        console.log("token is ", token);
        sendOffer(appointment_id, token, offer, otherUser.current);
        listenForAnswer(handleAnswer);
      }).catch(e => console.log(e));
    } 

    const handleICECandidateEvent = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate: ", event.candidate);
        sendICE(otherUser.current, event.candidate);
      }
    };

    const handleNewICECandidate = async (candidate) => {
      console.log("Peer connection while handling ICE candidates is ", peerRef.current);
      if (peerRef?.current?.iceConnectionState === "connected") {
        console.log("✅ Connection stable! Applying ICE candidate immediately.");
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log("🟡 Storing ICE candidate until connection is stable:", candidate);
        receivedICECandidates.current = [...receivedICECandidates.current, candidate];

        console.log("receivedICECandidatesState is ", receivedICECandidatesState);

        setReceivedICECandidatesState(prev=>[...prev, candidate]);
      }
    };

    useEffect(() => {
      console.log("state changed +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      const addCandidates = async () => {
        console.log("recieved candidates are ", receivedICECandidates?.current )
        console.log("total candidates are ", receivedICECandidates?.current.length )
        console.log("signalling state is ", peerRef?.current?.signalingState )
        console.log("remote video Current src is 1", remoteVideo.current.srcObject );
        if (receivedICECandidates?.current?.length !== 0 && peerRef?.current?.signalingState === "stable") {
          console.log("ICE candidate condition passed");
          
          for (const candidate of receivedICECandidates.current) {
            try {
              console.log("Adding ICE candidate: 1", candidate);
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              console.log("Added ICE candidate:", candidate);
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
            }
          }
          console.log("Added all candidates");
          
          // Clear the candidates after adding them if necessary
          // receivedICECandidates.current = [];
        }
      };
    
      addCandidates();
      console.log("Updated receivedICECandidatesState:", receivedICECandidatesState);
    }, [receivedICECandidatesState, signalingState]); 

  const saveNotes = ()=>{
    console.log("saviung the no6tes ");
    return;
  }

  const saveChats = ()=>{
    console.log("save chats is working");
  }

  const sendMessage = (e) => {
    e.preventDefault();
    console.log("Sending message");
    if (text.trim()?.length === 0 || text === undefined) {
      setText("");
      return;
    }
    sendChannel.current.send(text?.toString()?.trim());
    setMessages(messages => [...messages, {isMe: true, message: text}]);
    setText("");
  }

  // Function to toggle the microphone
  const toggleMic = () => {
    console.log("userStream is ", userStream.current);
    console.log("userVideo is ", userVideo.current);

    const audioTrack = userStream?.current?.getAudioTracks()[0];
    console.log("audio track is ", audioTrack);
    if (audioTrack) {
      const newState = !audioTrack.enabled;
      audioTrack.enabled = newState;
      // audioTrack.muted = newState;
      console.log("new audio tracks is ", audioTrack);
      setIsMicOn(prev=>!prev);
    }
  };

  // Function to toggle the microphone
  const toggleCamera = () => {
    console.log("userStream is ", userStream.current);
    console.log("userVideo is ", userVideo.current);
    // const audioTrack = userVideo.current?.getAudioTracks()[0];
    const videoTrack = userStream?.current?.getVideoTracks()[0];
    console.log("vide trac is ", videoTrack);
    console.log("video track is ", userStream?.current.getVideoTracks()[0]);
    if (videoTrack) {
      const newState = !videoTrack.enabled;
      videoTrack.enabled = newState;
      // audioTrack.muted = newState;
      console.log("new video tarcks is ", videoTrack);
      setIsCameraOn(prev=>!prev);
    }
  };

return (
  <>
      <div className="h-screen w-screen p-2 flex justify-center items-center bg-[#F9F4F1] overflow-hidden">

        {/* Chat and Notes below */}
        <div
          className={`w-[409px] 2xl:w-[729px] hidden h-full lg:flex flex-col justify-between overflow-y-hidden p-4`}
        >

          {/* Chat and Notes Toggler */}
          <div className="flex justify-start items-center w-full pt-8 pb-3 pl-6 gap-8 border border-solid border-x-0 border-t-0 border-b-1 border-[#E1DEDA] relative">
            <button
              className={`cursor-pointer ${focus === "chat" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent text-black"
                } border-b-2 text-2xl font-medium`}
              onClick={() => {
                setFocus("chat");
                isFocusRef.current = true;
                setNewMessage(false);
              }}
            >
              Chat
            </button>

            <button
              className={`cursor-pointer ${focus === "notes" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent text-black"
                } border-b-2 text-2xl font-medium`}
              onClick={() => 
              {
                setFocus("notes")
                isFocusRef.current = false;
              }}
            >
              Consultation Notes
            </button>

            {newMessage && (
              <>
                <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full left-[22px] bottom-[31px] animate-ping"></div>
                <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full left-[22px] bottom-[31px]"></div>
              </>
            )}

          </div>

          {/* Chat and Notes Content */}
          <div className="grow w-full p-5 flex justify-center items-end">
            {
              focus === "chat" && (
                <form className="flex flex-col w-full text-white h-full" onSubmit={sendMessage}>
                  <div className="grow overflow-x-hidden w-full">
                    <div className="p-2 h-dvh max-h-[calc(100vh_-_11.5rem)] overflow-y-auto overflow-x-hidden no__scrollbar text-wrap object-contain">
                    {messages?.map((item, index) => (
                      <div className={`w-fit max-w-[60%] text-wrap break-all my-1.5 p-3 text-black h-fit ${item?.isMe === true ? "bg-[#E6E8ED] ml-auto rounded-l-2xl rounded-tr-2xl" : "bg-[#FFD5B3] mr-auto rounded-r-2xl rounded-tl-2xl"}`} key={`${index}_${item?.message}`}>
                        {item?.message?.toString()}
                      </div>
                    ))}
                    {/* Scroll anchor to always scroll to the last message */}
                    <div ref={messagesEndRef} />
                    </div>
                  </div>
                  <div className="flex w-full h-fit gap-3 justify-between items-center">
                    <input type="text" value={text} className="grow bg-white rounded-sm pl-3 text-black h-full border-none" placeholder="Type a message..." onChange={(e) => setText(e.target.value)} />
                    <button type="submit" className="cursor-pointer rounded-full bg-blue-600 p-2 aspect-square hover:bg-white hover:text-blue-600 border border-solid border-blue-600">
                      O
                    </button>
                  </div>
                 
                </form>
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
            />
            <button 
            className="rounded-xl bg-blue-600 text-white px-6 py-4 w-full hover:bg-white hover:text-blue-600 border border-solid border-blue-600"
            onClick={() => saveNotes()}
            >
              Save Notes
            </button>
          </div>
          </>
              )
            }
          </div>

        </div>

        {/* Video Call Below */}
        <div id="call__container" className="grow bg-[#2B2B3A] h-full flex flex-col justify-start items-start relative">
          <div className="grow w-full flex flex-col justify-start items-center max-h-full">
            {/* {mediaError && <>{mediaError}</>} */}

            {/* remote stream */}
            <video 
            ref={remoteVideo}
            autoPlay 
            playsInline 
            className="scale-x-[-1] h-full w-full max-w-fit max-h-[736px] my-auto" 
            // className=`scale-x-[-1] h-full w-full max-w-fit ${container_height !== null}` 
            >
            </video>
          </div>
          
          {/* own stream */}
          <div
            className={`absolute bottom-28 2xl:bottom-[175px] right-6 w-[270px] 2xl:w-96 min-h-[207px] max-h-fit h-[207px] rounded-4xl overflow-hidden bg-black text-white`}
          >
            <video 
            ref={userVideo}
            autoPlay 
            playsInline 
            muted 
            className="scale-x-[-1] w-full h-full" 
            />
          </div>

          {/* partner Name #1F1F2B*/}
          <div className={`absolute px-6 py-2 rounded-full text-white text-xl bg-[#3A3A4D] text-center bottom-40 left-4`}>
            {signalingState === "stable" ?  (partnerName || "Anonymous") : "Waiting for the other User..."}
          </div>

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
    </>
);
}

export default ThirdRoom;
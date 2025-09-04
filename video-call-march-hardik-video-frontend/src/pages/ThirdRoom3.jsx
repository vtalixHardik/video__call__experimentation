// file imports, functions

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
	listenForICE,
	disconnectSocket,
	listenForUserLeft,
	resetSockets,
	saveChats,
} from "../services/socket";

// file imports, assets
import sendButton from "../assets/send__white.svg";
import mic__controls from "../assets/mic__control.svg";
import video__controls from "../assets/video__control.svg";
import end__call from "../assets/end__call.svg";

// dependency imports, react
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// dependency imports, socket.io-client
import { io } from "socket.io-client";


const ThirdRoom3 = ({ appointmentId, name, report, transcript }) => {
	const appointment_id = appointmentId.current;
	let new_socket;
	const navigate = useNavigate();

	// Refs and States for both Functionality and UI
	const remoteVideo = useRef(); // for passing in video tag
	const [notes, setNotes] = useState();
	const messagesRef = useRef([]);
	const [messages, setMessages] = useState([]);
	
	// Refs and States for UI
	const userVideo = useRef(); // for passing in video tag
	const [partnerName, setPartnerName] = useState();
	
	const [focus, setFocus] = useState("chat");
	const isFocusRef = useRef(true);
	const [newMessage, setNewMessage] = useState(false);
	
	const [text, setText] = useState("");
	const messagesEndRef = useRef(null);
	
	// Refs and States for Functionality
	const socketRef = useRef(); // for Socket emits and ons
	const userId = useRef();
	const otherUser = useRef(); //  for remoteSocketID
	
	const peerRef = useRef(); // for peer
	const userStream = useRef(); //  for addTrack
	const sendChannel = useRef();
	const [answerSent, setAnswerSent] = useState(false);
	
	const [isCameraOn, setIsCameraOn] = useState(true);
	const [isMicOn, setIsMicOn] = useState(true);
	
	const [signalingState, setSignalingState] = useState(null);
	
	const receivedICECandidates = useRef();
	// const [receivedICECandidatesState, setReceivedICECandidatesState] = useState(new Set());
	const [receivedICECandidatesState, setReceivedICECandidatesState] = useState([]);
	
	const [startTranscription, setStartTranscription] = useState(false);
	
	const mediaRecorderRef = useRef(null);

	// Monitor and update signaling state, only when the correct signalling state is their, we will apply ICE Candidates
	useEffect(() => {

		const interval = setInterval(() => {

			const currentState = peerRef?.current?.signalingState;
			if (peerRef?.current?.signalingState && currentState !== signalingState) {
				setSignalingState(currentState);
			}
		}, 100); // or on some RTC events if available

		return () => clearInterval(interval);

	}, [signalingState]);

	// function to start video call
	useEffect(() => {
		console.log("Starting with getting user Media");
		
		navigator?.mediaDevices
			?.getUserMedia({
				video: true,
				audio: true,
			})
			.then(async (stream) => {

				// taking the permission from the user's browser and setting the local stream in the video tag
				userVideo.current.srcObject = stream;// adding our own stream to Video Tag
				userStream.current = stream;// storing our stream to add tracks later

				new_socket = connectSocket();// storing socket instance to get Socket ID later

				// function to get Socket ID
				const checkSocketId = async () => {
					while (!new_socket?.id) {
						await new Promise((resolve) => setTimeout(resolve, 10)); // Retry until socket ID is available
					}
					userId.current = new_socket.id;
				};

				await checkSocketId();
				console.log("printing after we get our Socket ID ", userId.current);

				// now we will hit the join room
				joinRoom(appointment_id, name.current);

				// listen for Server to emit If we joined Room Successfully
				listenForJoinSuccess(handleJoinSuccess);
				
				// Listen for Incoming ICE Candidates
				listenForICE(handleNewICECandidate);
				
				// Listen if the User Left
				listenForUserLeft(endCall);

				// Listen for errors in Server Side Application
				listenForErrors(endCall);
			});

		return () => {
			// endCall();
		};
	}, []);

	// function to handle Successfully Joining Room at the Server Side Application
	const handleJoinSuccess = async (data) => {
		
		console.log("joined room successfully ", data);
		
		if (data.chats && data.chats.length !== 0) {
			console.log("adding chats");
			setMessages(data.chats);
			data.chats.map((item, index) => {
				messagesRef.current.push(item);
			});
		}
		if (data.notes && data.notes.length !== 0) {
			setNotes(data.notes);
		}
		setPartnerName(data?.opponent_name || "Ghost");
		// userId.current = data.socketId;

		const isFirst = !!(data.remoteSocket === null); // change to checking if there was remote Socket ID or offer or not
		console.log("is First", isFirst);
		if (isFirst) {
			console.log("listening for offer");
			listenForOffer(answerPeer);
		} else {
			console.log("sending offer and listening for answer");
			otherUser.current = data.remoteSocket;
			callPeer();
		}
	};

	// function to start call if you are second user to join the call
	const callPeer = () => {
		peerRef.current = createPeer(userId.current);

		userStream?.current
			?.getTracks()
			.forEach((track) =>
				peerRef.current.addTrack(track, userStream.current)
			);

		console.log("peerRef is ", peerRef.current);

		sendChannel.current = peerRef.current.createDataChannel("sendChannel");

		sendChannel.current.onmessage = handleReceiveMessage;
	};

	// function to initialize peer connection
	const createPeer = (id) => {
		const peer = new RTCPeerConnection({
			iceServers: [
				{ urls: "stun:stun.stunprotocol.org" },
				{ urls: "stun:stun3.l.google.com:5349" },
				{ urls: "stun:stun4.l.google.com:19302" },
				{ urls: "stun:stun4.l.google.com:5349" },
				{
					urls: "turn:turnserver.vtalix.com:3478?transport=tcp", // TCP fallback
					username: "turnuser",
					credential: "KeyVante1O8",
				},
			],
			iceTransportPolicy: "relay", // relay is another ENUM value that is allowed , this value is used to test TURN servers
		});
		/*
		 
		urls: [
			"turn:turnserver.vtalix.com:3478?transport=udp", // UDP first
			"turn:turnserver.vtalix.com:3478?transport=tcp", // TCP fallback
			"turns:turnserver.vtalix.com:5349?transport=tcp", // TLS fallback (if enabled by DevOps)
		],
		{
	 	urls: "relay1.expressturn.com:3480?transport=tcp",
	 	username: "000000002071139238",
		credential: "sNLp+wneWEYF1yw4mj3bq4bxqgM=",
		 },

		*/

		peer.onicecandidate = handleICECandidateEvent;

		peer.ontrack = handleTrackEvent;

		peer.onnegotiationneeded = () => {
			console.log("sending offer auto");
			handleNegotiationNeededEvent(id);
		};

		peer.oniceconnectionstatechange = () => {
			console.log(
				"🔄 ICE Connection State:",
				peerRef.current.iceConnectionState
			);

			if (peer.iceConnectionState === "connected") {
				console.log("✅ Connection stabilized!");
				setStartTranscription(true);
			}
		};
		peer.onconnectionstatechange = () => {
			console.log("Peer state:", peer.connectionState);
		};

		return peer;
	};

	// function to handle incoming offer and Answer the Peer in its response
	const answerPeer = (incoming) => {

		otherUser.current = incoming.from;

		setPartnerName(incoming?.name || "Ghost");

		// create peer to add offer as remote description
		peerRef.current = createPeer();

		peerRef.current.ondatachannel = (event) => {
			sendChannel.current = event.channel;
			sendChannel.current.onmessage = handleReceiveMessage;
		};

		const desc = new RTCSessionDescription(incoming.offer);

		peerRef.current
			?.setRemoteDescription(desc)
			.then(() => {
				userStream.current
					.getTracks()
					.forEach((track) =>
						peerRef.current.addTrack(track, userStream.current)
					);
			})
			.then(() => {
				return peerRef.current?.createAnswer();
			})
			.then((answer) => {

				peerRef.current?.setLocalDescription(answer);

				return answer;
			})
			.then((answer) => {

				// send answer to other peer
				sendAnswer(appointment_id, answer, incoming.from);
				// set answerSent state to true
				setAnswerSent(true);
			});
	};

	// function to handle incoming answer
	const handleAnswer = async (message) => {
		
		// validate if peer connection was initialized before handling answer 
		if (!peerRef.current) {

			console.log("❌ Peer Connection is not initialized yet!");
			
			return;
		}

		// Create a Session Description Protocol (SDP) to handle incoming answer
		const desc = new RTCSessionDescription(message?.answer);

		await peerRef?.current
			?.setRemoteDescription(desc)
			.catch((e) => console.log(e));

		console.log("peer ref in after handle answer is ", peerRef.current);
	};

	// function to handle tracks of Remote Video
	const handleTrackEvent = (e) => {
		console.log("Track event received! Waiting for remote video...");

		const waitForRemoteVideo = setInterval(() => {
			// "Runs even after clear Interval 1 if after remote Video set"
			console.log(
				"src of video before setting ",
				remoteVideo.current.srcObject
			);
			if (remoteVideo.current && remoteVideo.current.srcObject === null) {
				remoteVideo.current.srcObject = e.streams[0];
				console.log(
					"src of video after setting ",
					remoteVideo.current.srcObject
				);
				console.log("✅ Remote video set!");
			}
			if (remoteVideo.current && remoteVideo.current.srcObject !== null) {
				clearInterval(waitForRemoteVideo);
			}
		}, 100);
	};

	// function to create offer
	const handleNegotiationNeededEvent = () => {
		peerRef.current
			.createOffer()// create SDP Offer using WebRTC API's in built method and pass it to `.then()`
			.then((offer) => {

				// Set the self generated SDP offer as Local Description
				peerRef.current.setLocalDescription(offer);

				// return the offer for `.then()`
				return offer;
			})
			.then((offer) => {

				// send the offer to remote User
				sendOffer(appointment_id, offer, otherUser.current);
				
				// wait for their answer
				listenForAnswer(handleAnswer);
			})
			.catch((e) => console.log("error is ", e));
	};

	// function to send ICE candidate to other user
	const handleICECandidateEvent = (event) => {

		console.log("generated candidate is ", event.candidate);

		if (event.candidate) {

			console.log("Sending ICE candidate ", event.candidate, "to ", otherUser.current);
			
			sendICE(otherUser.current, event.candidate);
		}
		if (!event.candidate) {
			console.log("Generated Candidate is null, marking the completion of all candidates");
		}
	};

	// function to handle Incoming candidates from the Server Side Application
	const handleNewICECandidate = async (candidate) => {
		console.log(
			"Peer connection while handling incoming ICE candidates is ",
			peerRef.current
		);

		if (peerRef?.current && peerRef?.current?.remoteDescription !== null) {
			// if (peerRef?.current?.iceConnectionState === "connected") {
			console.log("remoteDESC is ", peerRef?.current?.remoteDescription);
			console.log("candidate is ", candidate);
			console.log(
				"✅ Connection stable! Applying ICE candidate immediately."
			);

			console.log("stored Candidates while applying Candidates immediately is ", receivedICECandidates.current);

			await peerRef.current.addIceCandidate(
				new RTCIceCandidate(candidate)
			);
		} else {
			console.log("remoteDESC is ", peerRef?.current?.remoteDescription);

			console.log(
				"🟡 Storing ICE candidate until connection is stable:",
				candidate
			);

			let currentCandidates = receivedICECandidates.current || [];

			console.log("current candidates are", currentCandidates);

			currentCandidates = [...currentCandidates, candidate];

			receivedICECandidates.current = currentCandidates;

			console.log("incomming candidates", receivedICECandidates.current);

			setReceivedICECandidatesState((prev) => [...prev, candidate]);
		}
	};

	// useEffect to add stored Ice candidates
	useEffect(() => {

		console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

		console.log(receivedICECandidates?.current?.length || 0, "received candidates are ", receivedICECandidates?.current);

		console.log("signalling state is ", peerRef?.current?.signalingState);

		console.log("remote video Current src is ", remoteVideo.current.srcObject);

		// function to add ICE Candidates
		const addCandidates = async () => {
			if (
				receivedICECandidates?.current &&// make sure received candidates are not undefined
				receivedICECandidates?.current?.length !== 0 &&// make sure if received candidates is not an empty array
				peerRef?.current?.signalingState === "stable" &&// make sure the signalling state is stable before applying ICE Candidates
				answerSent === true// make sure the SDP Answer was sent before applying the ICE Candidates
			) {
				console.log("ICE candidate condition passed");

				// Iterate through each Candidate and Apply them
				for (const candidate of receivedICECandidates.current) {
		
					console.log("Candidate being Applied", candidate);
		
					try {

						await peerRef.current.addIceCandidate(
							new RTCIceCandidate(candidate)
						);

						console.log("Candidate being Applied");
					
					} catch (error) {
		
						console.error("Error adding ICE candidate:", error);
		
					}
				}

				console.log("Added all candidates Successfully");

				// Clear the candidates after adding them if necessary
				// receivedICECandidates.current = [];
			}

			return;
		};

		// call function
		addCandidates();
	}, [receivedICECandidatesState, signalingState, answerSent]);

	// function to send message using data channel
	const sendMessage = (e) => {
		
		e.preventDefault();

		// Validation to prevent sending empty messages
		if (text.trim()?.length === 0 || text === undefined) {
			setText("");
			return;
		}

		// Send message only when Data Channel is established
		if (sendChannel.current?.readyState !== "open") return;

		sendChannel.current.send(text?.toString()?.trim());

		// set the Local Message after sending message to Remote Client
		setMessages((messages) => [
			...messages,
			{ isMe: true, user_id: userId.current, message: text },
		]);

		messagesRef.current.push({
			isMe: true,
			user_id: userId.current,
			message: text,
		});

		setText("");
	};

	// function to handle incoming chat messages
	const handleReceiveMessage = (e) => {

		// Change UI
		setMessages((messages) => [
			...messages,
			{ isMe: false, message: e.data },
		]);

		// Change the ref storing Chats
		messagesRef.current.push({
			isMe: false,
			message: e.data,
			old_text: true,
			user_id: otherUser.current,
		});

		// For creating a In-App notification
		if (isFocusRef.current === false) {
			setNewMessage(true);
		}
	};

	// Scroll to the bottom whenever messages change
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]); // This effect runs when messages change

	// Function to toggle the microphone
	const toggleMic = () => {

		const audioTrack = userStream?.current?.getAudioTracks()[0];

		if (audioTrack) {
		
			const newState = !audioTrack.enabled;
		
			audioTrack.enabled = newState;

			setIsMicOn((prev) => !prev);
		}
	};

	// Function to toggle the microphone
	const toggleCamera = () => {

		const videoTrack = userStream?.current?.getVideoTracks()[0];

		if (videoTrack) {

			const newState = !videoTrack.enabled;

			videoTrack.enabled = newState;

			setIsCameraOn((prev) => !prev);
		}
	};

	// function to endCall
	const endCall = () => {
		console.log("Ending call...");

		console.log("saving chats");

		let chats = messagesRef.current;

		saveChats(appointment_id, chats);

		// Stop all media tracks
		if (userStream.current) {
			userStream?.current?.getTracks()?.forEach((track) => track.stop());
		}

		if (remoteVideo.current) {
			remoteVideo?.current?.srcObject
				?.getTracks()
				?.forEach((track) => track?.stop());
		}

		if (userVideo.current) {
			userVideo?.current?.srcObject
				?.getTracks()
				?.forEach((track) => track?.stop());
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
		console.log("Making source of local video element null");
		console.log(
			"Making source of local video element null ",
			userVideo?.current?.srcObject
		);

		if (remoteVideo?.current) {
			console.log("setting the remoteVideo.current to null");
			remoteVideo.current.srcObject = null;
		}
		console.log("Making source of remote video element null");
		console.log(
			"Making source of remote video element null ",
			remoteVideo?.current?.srcObject
		);

		// Cleanup event listeners
		resetSockets();
		console.log("disconnecting socket");
		disconnectSocket();
		console.log("Emitting disconnect socket");

		receivedICECandidates.current = [];

		if (answerSent) {
			const getReport = async () => {
				console.log("[Front] Fetching report…");
				try {
					const resp = await fetch(
						// "http://localhost:4004/transcription/report",
						"https://vtalix-transcription.upteky.com/transcription/report",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"x-api-key":
									"2f791882d52905ebecc9057ac0e26da58f456caaf51b8344eef85c14d5d1686d",
							},
							body: JSON.stringify({
								callId: appointmentId.current,
							}),
						}
					);

					console.log("[Front] Report response status:", resp);

					const body = await resp.json();

					console.log("[Front] report response:", body);

					// assuming body.mergedTranscript

					console.log("Report in is ", body.mergedTranscript);

					//   setReport(body.mergedTranscript);
					report.current = body.mergedTranscript;

					// navigate("/");
				} catch (err) {
					console.error("Failed to fetch report:", err);
				}
			};

			getReport();
		}

		// Navigate back to the home page
		console.log("Navigating");
		navigate("/");
	};

	// Transcription code
	useEffect(() => {
		if (startTranscription) {
			console.log("Starting transcription...");
			socketRef.current = io("https://vtalix-transcription.upteky.com", {
				path: "/api/v1/transcribe/stream/socket",
				autoConnect: false,
			});

			// Listen for final transcript from server
			socketRef.current.on("transcript_complete", (data) => {
				console.log("[Front] transcript_complete received:", data);
				console.log(
					"[Front] transcript_complete received:",
					data.transcript
				);
				// setTranscript(data.transcript);
				transcript.current = data.transcript;

				socketRef.current.disconnect();
			});

			console.log("userStream is ", userStream.current);
			console.log(
				"userStream audio is ",
				userStream.current.getAudioTracks()[0]
			);

			const audioTrack = userStream.current.getAudioTracks()[0];
			const audioOnlyStream = new MediaStream([audioTrack]);
			console.log("audioOnlyStream is ", audioOnlyStream);

			mediaRecorderRef.current = new MediaRecorder(audioOnlyStream, {
				//line on 610
				mimeType: "audio/webm; codecs=opus",
			});

			// Open socket connection with query
			socketRef.current.io.opts.query = {
				api_key:
					"2f791882d52905ebecc9057ac0e26da58f456caaf51b8344eef85c14d5d1686d",
				callId: appointmentId.current,
				userId: userId.current,
				// userId: "userB",
			};

			socketRef.current.connect();

			socketRef.current.emit("start_stream");
			console.log("[Front] Emitted start_stream");

			mediaRecorderRef.current.ondataavailable = (e) => {
				if (e.data.size > 0) {
					console.log(
						"[Front] Sending audio_chunk of size:",
						e.data.size
					);
					socketRef.current.emit("audio_chunk", e.data);
				}
			};

			mediaRecorderRef.current.onstart = () => {
				console.log("[Front] MediaRecorder started");
			};

			mediaRecorderRef.current.onstop = () => {
				console.log("[Front] MediaRecorder stopped");
			};

			// return;

			mediaRecorderRef.current.start(200); // on line 649
		}

		return () => {
			console.log("Cleaning up transcription state");
			// mediaRecorderRef.current.stop();

			if (socketRef.current?.connected) {
				socketRef.current.emit("audio_stream_end");
				socketRef.current.disconnect();
			}

			setStartTranscription(false);
		};
	}, [startTranscription]);

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
							className={`cursor-pointer ${
								focus === "chat"
									? "border-[#FF7201] text-[#FF7201]"
									: "border-transparent text-black"
							} border-b-2 text-2xl font-medium`}
							onClick={() => {
								setFocus("chat");
								isFocusRef.current = true;
								setNewMessage(false);
							}}
						>
							Chat
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
						{focus === "chat" && (
							<form
								className="flex flex-col w-full text-white h-full"
								onSubmit={sendMessage}
							>
								<div className="grow overflow-x-hidden w-full">
									<div className="p-2 h-dvh max-h-[calc(100vh_-_11.5rem)] overflow-y-auto overflow-x-hidden no__scrollbar text-wrap object-contain">
										{messages?.map((item, index) => {
											return (
												<div
													className={`w-fit max-w-[80%] text-wrap break-all my-1.5 p-3 text-black h-fit ${
														!!item.user_id &&
														item?.user_id ===
															userId.current
															? "bg-[#E6E8ED] ml-auto rounded-l-2xl rounded-tr-2xl"
															: "bg-[#FFD5B3] mr-auto rounded-r-2xl rounded-tl-2xl"
													}`}
													key={`${index}_${item?.message}`}
												>
													{item?.message?.toString()}
												</div>
											);
										})}
										{/* Scroll anchor to always scroll to the last message */}
										<div ref={messagesEndRef} />
									</div>
								</div>
								<div className="flex w-full h-fit gap-3 justify-between items-center">
									<input
										type="text"
										value={text}
										className="grow bg-white rounded-sm pl-3 text-black h-full border-none"
										placeholder="Type a message..."
										onChange={(e) =>
											setText(e.target.value)
										}
									/>
									<button
										type="submit"
										className="min-w-fit cursor-pointer rounded-full hover:bg-orange-200 p-2 aspect-square bg-orange-600 hover:text-blue-600 border border-solid border-orange-600"
									>
										<img
											src={sendButton}
											alt=""
											className="text-red-900"
										/>
									</button>
								</div>
							</form>
						)}
					</div>
				</div>

				{/* Video Call Below */}
				<div
					id="call__container"
					className="grow bg-[#2B2B3A] h-full flex flex-col justify-start items-start relative"
				>
					<div className="grow w-full flex flex-col justify-start items-center max-h-full overflow-hidden relative rounded-md">
						{/* {mediaError && <>{mediaError}</>} */}

						{/* remote stream */}
						<video
							ref={remoteVideo}
							autoPlay
							playsInline
							className="w-full max-w-fit !h-[736px] my-auto object-fit rounded-lg"
							// className=`scale-x-[-1] h-full w-full max-w-fit ${container_height !== null}`
						></video>
					</div>

					{/* own stream */}
					<div
						className={`absolute bottom-28 2xl:bottom-[175px] right-6 w-[270px] 2xl:w-96 min-h-[207px] max-h-fit h-[207px] rounded-3xl overflow-hidden bg-black text-white`}
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
					<div
						className={`absolute px-6 py-2 rounded-full text-white text-xl bg-[#3A3A4D] text-center bottom-40 left-4`}
					>
						{signalingState === "stable"
							? partnerName || "Anonymous"
							: "Waiting for the other User..."}
					</div>

					{/* Controls of Video Call Below */}
					<div
						className={`w-full bg-[#9DA5B8] h-[80px] 2xl:h-[150px] flex justify-center items-center gap-12`}
					>
						<button
							className={`2xl:h-[75.5px] 2xl:w-[75.5px] p-5 rounded-full cursor-pointer ${
								isMicOn ? "bg-white" : " bg-red-600"
							}`}
							onClick={() => toggleMic()}
						>
							<img
								src={mic__controls}
								alt=""
								className="w-full h-full"
							/>
						</button>

						<button
							className={`h-fit w-fit p-5 bg-red-600 text-white rounded-[22px] cursor-pointer`}
							onClick={() => endCall()}
						>
							<img
								src={end__call}
								alt=""
								className="w-full h-full"
							/>
						</button>

						<button
							className={`2xl:h-[75.5px] 2xl:w-[75.5px] text-red-600 p-5 rounded-full cursor-pointer ${
								isCameraOn ? "bg-white" : " bg-red-600"
							}`}
							onClick={() => toggleCamera()}
						>
							<img
								src={video__controls}
								alt=""
								className="w-full h-full"
							/>
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default ThirdRoom3;

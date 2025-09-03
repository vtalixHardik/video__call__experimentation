// import React, { useEffect, useState } from 'react'
// import { connectSocket, joinRoom, listenForJoinSuccess, listenForErrors, listenForOffer, sendAnswer, listenForAnswer } from "../services/socket";

// const Connector = ({generatedOfferRef, peerConnectionRef, setConnection, remoteVideoRef, remoteSocketRef}) => {
//     const [stage, setStage] = useState(1);
//     const handleJoinRoom = () => {
//         console.log("Joining room");
//         connectSocket();
//         const appointment_id = localStorage.getItem("appointmentId");
//         const token = localStorage.getItem("token");
//         console.log("Offer is ", generatedOfferRef.current);
//         console.log("appointmentID is ", appointment_id);
//         console.log("token is ", token);
//         // joinRoom(appointment_id, token, offerRef.current);
//     }

//     const renderStageContent = () => {
//         switch (stage) {
//             case 1:
//                 return <h1>Joining Room...</h1>;
//             case 2:
//                 return <h1>Waiting for other participant to join...</h1>;
//             case 3:
//                 return <h1>Offer Sent</h1>;
//             default:
//                 return <h1>Unknown Stage</h1>;
//         }
//     };

//     useEffect(() => {
//         handleJoinRoom();
//         listenForJoinSuccess(async (data) => {
//             console.log("Joined Room");
//             console.log("data is ", data);
//             console.log("data.offer is ", data.offer);
//             console.log("data.remoteSocket is ", data.remoteSocket);
//             setStage(2);
//             if(data.offer && data.remoteSocket){
//                 console.log("there is an existing user");
//                 remoteSocketRef.current = data.remoteSocket;
//                 const offer = data.offer;
//                 await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
//                 const answer = peerConnectionRef.current.createAnswer();
//                 await peerConnectionRef.current.setLocalDescription(answer);
//                 console.log("peer connection for second joinee ", peerConnectionRef.current);
//                 // sendAnswer(answer, data.remoteSocket);
//             }else{
//                 console.log("Offer not found");
//                 await peerConnectionRef.current.setLocalDescription(generatedOfferRef.current);
//                 console.log("setting up for answer listener");
//                 listenForAnswer(async (data) => {
//                     try {
//                         console.log("Received answer data:", data);
//                         remoteSocketRef.current = data.from;
//                         // localStorage.setItem("answer", JSON.stringify(data.answer));
//                         await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
//                         console.log("Remote description set successfully.");
//                         console.log("peer connection for first joinee ", peerConnectionRef.current);

//                     } catch (error) {
//                         console.error("Error in listening for answer:", error);
//                     }
//                 });
//             }
//             // 
//             const final_offer = data.offer;
//             localStorage.setItem("offer", JSON.stringify(final_offer));
//             localStorage.setItem("remoteSocketId", data.remoteSocket);
//         });
//     }, [])
//   return (
//     <div className='flex justify-center items-center bg-white'>
//         {renderStageContent()}
//     </div>
//   )
// }

// export default Connector;
import React, { useEffect, useState } from 'react';
import {
  connectSocket,
  joinRoom,
  listenForJoinSuccess,
  listenForErrors,
  listenForOffer,
  sendAnswer,
  listenForAnswer
} from '../services/socket';

const Connector = ({ generatedOfferRef, peerConnectionRef, remoteVideoRef, remoteSocketRef, setConnection }) => {
  const [stage, setStage] = useState(1);

  const handleJoinRoom = () => {
    console.log('Joining room');
    connectSocket();

    const appointment_id = localStorage.getItem('appointmentId');
    const token = localStorage.getItem('token');

    console.log('Offer is ', generatedOfferRef.current);
    console.log('appointmentID is ', appointment_id);
    console.log('token is ', token);

    joinRoom(appointment_id, token, generatedOfferRef.current);
  };

  useEffect(() => {
    handleJoinRoom();

    const handleJoinSuccess = async (data) => {
      console.log('Joined Room', data);
      setStage(2);

      if (data.offer && data.remoteSocket) {
        console.log('Existing user detected', data);
        remoteSocketRef.current = data.remoteSocket;

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        const appointment_id = localStorage.getItem('appointmentId');
        const token = localStorage.getItem('token');
        console.log("appointment_idd is ", appointment_id);
        console.log("token is ", token);
        console.log('Sending answer:', answer);
        sendAnswer(appointment_id, token, answer, data.remoteSocket);
        console.log("after sending answer, setting connection to connected");
        setConnection("connected");
      } else {
        console.log('No existing offer, setting up for answer listener');
        console.log("Current Signaling State:", peerConnectionRef.current.signalingState);
        // Ensure stable state before setting local description
        if (peerConnectionRef.current.signalingState !== 'stable') {
            console.warn('Signaling state is not stable. Restarting ICE...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
            // await peerConnectionRef.current.restartIce();
        }
        

        await peerConnectionRef.current.setLocalDescription(generatedOfferRef.current);
        console.log('Local description set successfully');

        const handleAnswer = async (data) => {
          try {
            console.log('Received answer:', data);
            remoteSocketRef.current = data.from;
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('Remote description set successfully, setting connection to connected');
            setConnection("connected");
          } catch (error) {
            console.error('Error processing answer:', error);
          }
        };

        listenForAnswer(handleAnswer);
      }

      localStorage.setItem('remoteSocketId', data.remoteSocket);
    };

    listenForJoinSuccess(handleJoinSuccess);

    return () => {
      // Cleanup event listeners
      listenForJoinSuccess(null);
      listenForAnswer(null);
    };
  }, []); // No dependencies to prevent unnecessary re-renders

  return (
    <div className='flex justify-center items-center bg-white'>
      {stage === 1 && <h1>Joining Room...</h1>}
      {stage === 2 && <h1>Waiting for other participant to join...</h1>}
      {stage === 3 && <h1>Offer Sent</h1>}
    </div>
  );
};

export default Connector;

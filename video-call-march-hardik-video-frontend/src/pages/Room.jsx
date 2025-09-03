import { useEffect, useRef } from "react";
import { listenForAnswer, listenForOffer, sendAnswer } from "../services/socket";

const Room = ()=>{
    const appointment_id = "vtalix_appointment_105"
    // const peerConnection = useRef(null);
    const token = localStorage.getItem("token");
    const storedOffer = localStorage.getItem("offer");
    const offer = storedOffer ? JSON.parse(storedOffer) : null;
    const remoteSocketId = localStorage.getItem("remoteSocketId");
    const peerConnection = useRef(new RTCPeerConnection());
    const own_offer = JSON.parse(localStorage.getItem("own_offer"));
    console.log("own_offer is ", own_offer);
    peerConnection.current.setLocalDescription(own_offer);
    // const local_offer = localStorage.getItem("offer");
    // user 2 function to handle offer from user 1(server)
    // useEffect(()=>{
    //     console.log('working in room useEffect');
    //     const listenForTheLocalOffer = async (offer) => {
    //         const remoteSocketId = localStorage.getItem("remoteSocketId");
    //         console.log('remote socket id is ', remoteSocketId);
    //         if(remoteSocketId !== "null"){
    //             console.log("offer from the server is ", offer)
    //             const answer = await createAnswer(offer);
    //             console.log("answer from the create answer is ", answer);
    //             sendAnswer(appointment_id, token, answer, remoteSocketId);
    //         }
    //     };
    //     listenForTheLocalOffer(offer);
    // }, [offer]);
    useEffect(() => {
        if (!offer) return; // Avoid running if no offer is stored

        console.log("Received offer, creating answer...");
        const handleOffer = async () => {
            if (remoteSocketId && remoteSocketId !== "null") {
                const answer = await createAnswer(offer);
                console.log("Answer created:", answer);
                sendAnswer(appointment_id, token, answer, remoteSocketId);
            }
        };
        handleOffer();
    }, [offer, remoteSocketId]);
    // user 1 function to handle answer from user 2
    // useEffect(()=>{
    //     console.log("random eeffect");
    //     listenForAnswer(async (data)=>{
    //         try{
                
    //             console.log("data in recieve answer is ", data);
    //             console.log("data. from ", data.from);
    //             localStorage.setItem("remoteSocketId", data.from)
    //             localStorage.setItem("answer", JSON.stringify(data.answer));
    //             console.log("data. from ", data.answer);
    //             console.log("peerconnection ", peerConnection.current);
    //             await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));// error: DOMException: Cannot set remote answer in state stable
    //             console.log("done till here");
    //         }catch(error){
    //             console.log("error in listening answer ", error);
    //         }
    //     })
    // }, []);

    useEffect(() => {
        console.log("Setting up answer listener...");
        listenForAnswer(async (data) => {
            try {
                console.log("Received answer data:", data);
                localStorage.setItem("remoteSocketId", data.from);
                localStorage.setItem("answer", JSON.stringify(data.answer));

                console.log("peer connection current is", peerConnection.current);
                if (peerConnection.current.remoteDescription !== null || !peerConnection.current.remoteDescription) {
                    console.log("data.answer is ", data.answer);
                    console.log("peeer connectioj remote is ", peerConnection.current.remoteDescription);
                    await peerConnection.current.setRemoteDescription(data.answer);
                    // await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    console.log("Remote description set successfully.");
                }
            } catch (error) {
                console.error("Error in listening for answer:", error);
            }
        });
    }, []);

    // const createNewAnswer

    const createAnswer = async (offer) => {
        console.log("offer in creare answer is ", offer);
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        console.log("answer to be sent it ", answer);
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate:", event.candidate);
                // Send ICE candidate via socket
            }
        };
        return answer;
    };


    return(<>
        this is the room.    
    </>);
}

export default Room;
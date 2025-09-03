import { useEffect, useState } from "react";
import socket from "../services/socket";

const Call = () => {
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    socket.on("incoming:call", (data) => {
      console.log("Incoming call:", data);
      setIncomingCall(data);
    });

    return () => socket.off("incoming:call");
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {incomingCall ? (
        <div>
          <p>Incoming call from {incomingCall.callerId}</p>
          <button className="bg-green-500 text-white p-2">Accept</button>
          <button className="bg-red-500 text-white p-2 ml-2">Reject</button>
        </div>
      ) : (
        <p>No active call</p>
      )}
    </div>
  );
};

export default Call;

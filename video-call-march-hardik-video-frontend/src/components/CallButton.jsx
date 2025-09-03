import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { startCall } from "../store/callSlice";

const CallButton = ({ appointmentId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.call);
  const [offer, setOffer] = useState("");

  const handleCallStart = () => {
    dispatch(startCall({ appointment_id: appointmentId, offer }));
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter WebRTC Offer"
        value={offer}
        onChange={(e) => setOffer(e.target.value)}
      />
      <button onClick={handleCallStart} disabled={loading}>
        {loading ? "Starting Call..." : "Start Call"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default CallButton;

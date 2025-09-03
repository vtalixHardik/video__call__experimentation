import React from "react";
import CallButton from "../components/CallButton";

const CallPage = () => {
  const appointmentId = "2"; // Example Appointment ID

  return (
    <div>
      <h1>Call Page</h1>
      <CallButton appointmentId={appointmentId} />
    </div>
  );
};

export default CallPage;

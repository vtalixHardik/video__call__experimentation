import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Call from "./pages/Call";
import VideoCall from "./pages/VideoCall";
import Lobby from "./pages/Lobby";
import Login2 from "./pages/Login2";
// import Room2 from "./pages/Room4";
import Room2 from "./pages/Room2";
import SecondRoom from "./pages/SecondRoom";
import Room4 from "./pages/Room4";
import Room5 from "./pages/Room5";
import ThirdRoom from "./pages/ThirdRoom";
import ThirdRoom2 from "./pages/ThirdRoom2";
import { useRef } from "react";
import ThirdRoom3 from "./pages/ThirdRoom3";

// Hardik here
function App() {
  const appointment_id = useRef();
  const name = useRef();
  const report = useRef(null);
  const transcript = useRef(null);
  return (
    <Router>
      <Routes>

        <Route path="/call/:meetingId" element={<Lobby />} />
        {/* <Route path="/room/:meetingId" element={<Room2 />} /> */}

        {/* <Route path="/room/:meetingId" element={<Room5/>} /> */}
        {/* <Route path="/room/:meetingId" element={<SecondRoom />} /> */}
        {/* <Route path="/room/:meetingId" element={<ThirdRoom end_time={end_time} />} /> */}
        <Route path="/room/:meetingId" element={<ThirdRoom3 appointmentId={appointment_id}  name={name} report={report} transcript={transcript} />} />
        {/* { setIsOpen, appointmentId, setAppointmentComplete } */}

        {/* <Route path="/room/:meetingId" element={<ThirdRoom2 />} /> */}
        {/* <Route path="/room/:meetingId" element={<Room2 />} /> */}
        {/* <Route path="/room/:meetingId" element={<Room />} /> */}
        {/* <Route path="/" element={<Login />} /> */}
        <Route path="/" element={<Login2  appointment_id={appointment_id}  name={name} report={report} transcript={transcript} />} />
        </Routes>
    </Router>
  );
}

export default App;

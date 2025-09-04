import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login2 = ({ appointment_id, name, report, transcript }) => {
	try {
		console.log(
			"Login2 component rendered report.current is ",
			report.current
		);
		console.log(
			"Login2 component rendered transcript.current is ",
			transcript.current
		);
		const navigate = useNavigate();

		const [appointmentId, setAppointmentId] = useState("vtalix14");

		const [personName, setPersonName] = useState("rajesh");

		const [loginReport, setLoginReport] = useState(report.current);
		const [loginTranscript, setLoginTranscript] = useState(
			transcript.current
		);

		const handleSubmit = () => {
			// if(!token || !appointmentId) return;
			console.log("submitting");
			// if (token === "") return;
			if (appointmentId === "") return;
			localStorage.setItem("appointmentId", appointmentId);
			appointment_id.current = appointmentId;
			localStorage.setItem("name", name);
			name.current = personName;
			console.log("navigating now");

			navigate(`/room/${appointmentId}`);
		};
		return (
			<div className="flex justify-center items-center min-h-screen w-screen ">
				<div className="grid grid-cols-1 md:grid-cols-2 w-full md:w-3/4 h-fit bg-gray-200 p-4 rounded-xl">
					<div className=" p-4 border border-solid border-x-0 border-t-0 lg:border-y-0 lg:border-l-0 lg:border-x-1">
						<p className="text-4xl">Note:</p>
						<ul className="pl-5 text-xl">
							<li className=" list-disc">
								See if you can use two device to avoid a bug
							</li>
							<li className=" list-disc">
								If two user from same device join the Video
								call,
							</li>
							<li className=" list-disc">
								then the last role that entered, there `socket
								instance` will be sent even for the first user
								that entered(When Join button is pressed)
							</li>
							<li className=" list-disc">
								You will see User 1 entering twice
							</li>
							<li className=" list-disc">
								To avoid this bug for the time being, from a
								single device make a user join the room(When
								Join button is pressed) before the other user
								passes Login
							</li>

							<li className=" list-disc text-red-600">
								{" "}
								If you open the website on two tabs before
								making one user join the video call, It can
								result in a bug where first user&apos;s socket
								ID will be used even for second user by the
								computer
							</li>
						</ul>
					</div>

					<div className="flex flex-col justify-between items-start w-full gap-4 p-4 border border-solid border-x-0 border-b-0 lg:border-y-0 lg:border-r-0 lg:border-x-1">
						<div className="flex flex-col justify-start items-start w-full">
							<label htmlFor="name">Name</label>
							<input
								type="text"
								id="name"
								value={personName}
								className="p-3 bg-white w-full"
								onChange={(e) => {
									console.log(
										"setting name to ",
										e.target.value
									);
									return setPersonName(e.target.value);
								}}
							/>
						</div>

						<div className="flex flex-col justify-start items-start w-full">
							<label htmlFor="appointment_id">
								Appointment ID
							</label>
							<input
								type="text"
								id="appointment_id"
								value={appointmentId}
								className="p-3 bg-white w-full"
								onChange={(e) =>
									setAppointmentId(e.target.value)
								}
							/>
						</div>
						<div className="w-full flex justify-end items-center">
							<button
								className="rounded-full px-6 py-3 bg-orange-600 hover:bg-white hover:text-orange-600 text-white cursor-pointer"
								onClick={() => handleSubmit()}
							>
								Start Therapy
							</button>
						</div>
					</div>
				</div>

				<div className="min-h-24 min-w-24">
					<pre>{loginReport}</pre>
				</div>

				<div className="min-h-24 min-w-24">
					<pre>{loginTranscript}</pre>
				</div>
			</div>
		);
	} catch (error) {
		console.log("error in login2 is ", error);
	}
};

export default Login2;

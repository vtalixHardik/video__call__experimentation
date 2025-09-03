import { useState } from "react";

const Chat = ({ chat, setChats, notes, setNotes, dataChannelRef }) => {
  const [focus, setFocus] = useState("chat");
  const [message, setMessage] = useState(""); // Message state for input

  const sendMessage = () => {
    if (!message.trim()) return; // Empty message check

    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      dataChannelRef.current.send(message);
      setChats((prev) => [...prev, { sender: "You", message }]);
      setMessage(""); // Clear input field after sending
    } else {
      console.warn("DataChannel is not open yet.");
    }
  };

  return (
    <div className="flex flex-col justify-start items-center w-full h-full">
      {/* Chat & Notes Tabs */}
      <div className="flex justify-start items-center w-full h-fit pt-8 pb-3 pl-6 gap-8 border border-solid border-x-0 border-t-0 border-b-1 border-[#E1DEDA]">
        <div
          className={`cursor-pointer ${
            focus === "chat" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent"
          } border-b-2`}
          onClick={() => setFocus("chat")}
        >
          <p className="text-2xl font-medium">Chat</p>
        </div>
        <div
          className={`cursor-pointer ${
            focus === "notes" ? "border-[#FF7201] text-[#FF7201]" : "border-transparent"
          } border-b-2`}
          onClick={() => setFocus("notes")}
        >
          <p className="text-2xl font-medium">User Notes</p>
        </div>
      </div>

      {/* Chat Section */}
      {focus === "chat" && (
        <div className="flex flex-col justify-start items-center w-full grow">
          <div className="w-full grow p-4 overflow-y-auto">
            {chat?.map((msg, index) => (
              <div
                key={index}
                className={`p-2 my-1 rounded-md w-fit ${
                  msg.sender === "You" ? "bg-[#FF7201] text-white self-end" : "bg-gray-200 self-start"
                }`}
              >
                <strong>{msg.sender}: </strong>
                {msg.message}
              </div>
            ))}
          </div>

          {/* Input & Send Button */}
          <div className="w-full h-[80px] flex justify-end items-center px-3 gap-2">
            <input
              type="text"
              className="grow max-w-[670px] h-full max-h-[53px] bg-white px-6 rounded-lg border border-gray-300"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              className="bg-[#FF7201] text-white hover:bg-white hover:text-orange-600 w-fit h-full max-h-[53px] px-6 rounded-lg cursor-pointer"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Notes Section */}
      {focus === "notes" && (
        <div className="flex flex-col justify-start items-center w-full grow">
          <div className="w-full grow p-4">
            <textarea
              className="w-full p-5 h-[calc(100vh-200px)] resize-none overflow-y-auto border border-gray-300 rounded-md text-4xl"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          <div className="w-full h-[80px] flex justify-center items-center px-6 py-2">
            <button className="bg-[#0644EB] text-white hover:bg-white hover:text-[#0644EB] w-full h-full rounded-lg cursor-pointer border border-solid border-[#0644EB] text-2xl">
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;

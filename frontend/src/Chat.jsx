import { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Chat() {

  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const [allChats, setAllChats] = useState({});
  const [currentChatId, setCurrentChatId] = useState(null);

  // =========================
  // LOAD SAVED CHATS
  // =========================

  useEffect(() => {

    const savedChats = localStorage.getItem("aegis_chats");

    if (savedChats) {

      const parsed = JSON.parse(savedChats);

      setAllChats(parsed);

      const firstChatId = Object.keys(parsed)[0];

      if (firstChatId) {
        setCurrentChatId(firstChatId);
      }

    } else {

      createNewChat();

    }

  }, []);

  // =========================
  // SAVE TO LOCAL STORAGE
  // =========================

  useEffect(() => {

    localStorage.setItem(
      "aegis_chats",
      JSON.stringify(allChats)
    );

  }, [allChats]);

  // =========================
  // CREATE NEW CHAT
  // =========================

  const createNewChat = () => {

    const id = Date.now().toString();

    const newChat = {
      title: "New Chat",
      messages: []
    };

    setAllChats((prev) => ({
      ...prev,
      [id]: newChat
    }));

    setCurrentChatId(id);

  };

  // =========================
  // DELETE CHAT
  // =========================

  const deleteChat = (id) => {

    const updated = { ...allChats };

    delete updated[id];

    setAllChats(updated);

    const remaining = Object.keys(updated);

    if (remaining.length > 0) {
      setCurrentChatId(remaining[0]);
    } else {
      createNewChat();
    }

  };

  // =========================
  // RENAME CHAT
  // =========================

  const renameChat = (id) => {

    const newTitle = prompt("Enter new chat name:");

    if (!newTitle) return;

    setAllChats((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        title: newTitle
      }
    }));

  };

  // =========================
  // CURRENT CHAT
  // =========================

  const currentChat =
    allChats[currentChatId]?.messages || [];

  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = async () => {

    if (!message.trim()) return;

    try {

      const history = currentChat.flatMap((c) => [
        {
          role: "user",
          content: c.user
        },
        {
          role: "assistant",
          content: c.bot
        }
      ]);

      history.push({
        role: "user",
        content: message
      });

      // Add user message instantly
      const updatedMessages = [
        ...currentChat,
        {
          user: message,
          bot: ""
        }
      ];

      setAllChats((prev) => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: updatedMessages,
          title:
            prev[currentChatId].title === "New Chat"
              ? message.slice(0, 30)
              : prev[currentChatId].title
        }
      }));

      setMessage("");

      // STREAMING
      const response = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message,
            history
          })
        }
      );

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let fullResponse = "";

      while (true) {

        const { done, value } =
          await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value);

        fullResponse += chunk;

        setAllChats((prev) => {

          const msgs =
            prev[currentChatId].messages;

          const updated = [...msgs];

          updated[updated.length - 1] = {
            user: message,
            bot: fullResponse
          };

          return {
            ...prev,
            [currentChatId]: {
              ...prev[currentChatId],
              messages: updated
            }
          };

        });

      }

    } catch (error) {

      console.error(error);

    }

  };

  // =========================
  // PDF UPLOAD
  // =========================

  const uploadPDF = async () => {

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {

      const res = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData
      );

      alert(res.data.message);

    } catch (err) {

      console.error(err);

    }

  };

  // =========================
  // UI
  // =========================

  return (

    <div className="flex h-screen bg-zinc-950 text-white">

      {/* SIDEBAR */}

      <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">

        <div className="p-4 border-b border-zinc-800">

          <button
            onClick={createNewChat}
            className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-zinc-200"
          >
            + New Chat
          </button>

        </div>

        <div className="flex-1 overflow-y-auto p-2">

          {Object.entries(allChats).map(
            ([id, chat]) => (

              <div
                key={id}
                className={`p-3 mb-2 rounded-lg cursor-pointer ${
                  currentChatId === id
                    ? "bg-zinc-800"
                    : "hover:bg-zinc-800"
                }`}
                onClick={() => setCurrentChatId(id)}
              >

                <div className="flex justify-between items-center">

                  <p className="truncate text-sm">
                    {chat.title}
                  </p>

                  <div className="flex gap-2">

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameChat(id);
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(id);
                      }}
                    >
                      🗑️
                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

      {/* MAIN CHAT */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <div className="border-b border-zinc-800 p-4 bg-zinc-900">

          <h1 className="text-2xl font-bold">
            Aegis AI
          </h1>

        </div>

        {/* CHAT */}

        <div className="flex-1 overflow-y-auto p-6">

          {currentChat.map((c, i) => (

            <div key={i} className="mb-8">

              {/* USER */}

              <div className="flex justify-end mb-3">

                <div className="bg-blue-600 px-4 py-3 rounded-2xl max-w-2xl">
                  {c.user}
                </div>

              </div>

              {/* AI */}

              <div className="flex justify-start">

                <div className="bg-zinc-800 px-5 py-4 rounded-2xl max-w-3xl">

                  <div className="prose prose-invert max-w-none">

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {c.bot}
                    </ReactMarkdown>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* INPUT AREA */}

        <div className="border-t border-zinc-800 p-4 bg-zinc-900">

          <div className="flex gap-3">

            <input
              type="file"
              onChange={(e) =>
                setFile(e.target.files[0])
              }
              className="text-sm"
            />

            <button
              onClick={uploadPDF}
              className="bg-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-600"
            >
              Upload PDF
            </button>

          </div>

          <div className="flex gap-3 mt-4">

            <input
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Ask anything..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />

            <button
              onClick={sendMessage}
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
            >
              Send
            </button>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Chat;
import { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { motion } from "framer-motion";

import toast, { Toaster } from "react-hot-toast";

import { Prism as SyntaxHighlighter }
from "react-syntax-highlighter";

import { oneDark }
from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  Document,
  Page,
  pdfjs
} from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Bot } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

function App() {

  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const [pdfFile, setPdfFile] =
    useState(null);

  const [selectedPage, setSelectedPage] =
    useState(1);

  const [editingChatId, setEditingChatId] =
    useState(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [allChats, setAllChats] =
    useState({});

  const [currentChatId, setCurrentChatId] =
    useState("");

  const [loading, setLoading] =
    useState(false);
    const [showPDF, setShowPDF] =
  useState(false);

  // =========================
  // LOAD CHATS
  // =========================

  useEffect(() => {

    const saved =
      localStorage.getItem("aegis_chats");

    if (saved) {

      try {

        const parsed =
          JSON.parse(saved);

        Object.keys(parsed).forEach(
          (id) => {

            if (!parsed[id].messages) {
              parsed[id].messages = [];
            }

            if (!parsed[id].title) {
              parsed[id].title =
                "New Chat";
            }

          }
        );

        setAllChats(parsed);

        const first =
          Object.keys(parsed)[0];

        if (first) {

          setCurrentChatId(first);

        } else {

          createNewChat();

        }

      } catch (err) {

        console.error(err);

        createNewChat();

      }

    } else {

      createNewChat();

    }

  }, []);

  // =========================
  // SAVE CHATS
  // =========================

  useEffect(() => {

    localStorage.setItem(
      "aegis_chats",
      JSON.stringify(allChats)
    );

  }, [allChats]);

  // =========================
  // CREATE CHAT
  // =========================

  const createNewChat = () => {

    const id =
      Date.now().toString();

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

    const updated =
      { ...allChats };

    delete updated[id];

    setAllChats(updated);

    const remaining =
      Object.keys(updated);

    if (remaining.length > 0) {

      setCurrentChatId(
        remaining[0]
      );

    } else {

      createNewChat();

    }

  };

  // =========================
  // RENAME CHAT
  // =========================

  const saveChatTitle = (id) => {

    if (!editingTitle.trim()) return;

    setAllChats((prev) => ({

      ...prev,

      [id]: {

        ...prev[id],

        title: editingTitle

      }

    }));

    setEditingChatId(null);

    setEditingTitle("");

    toast.success("Chat renamed");

  };

  // =========================
  // CURRENT CHAT
  // =========================

  const currentMessages =
    allChats?.[currentChatId]?.messages || [];

  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = async () => {

    if (loading) return;

    if (!message.trim()) return;

    if (!currentChatId) return;

    setLoading(true);

    const userMessage = message;

    const history =
      currentMessages.flatMap(
        (c) => [

          {
            role: "user",
            content: c.user
          },

          {
            role: "assistant",
            content: c.bot
          }

        ]
      );

    history.push({

      role: "user",

      content: userMessage

    });

    const updatedMessages = [

      ...currentMessages,

      {
        user: userMessage,
        bot: ""
      }

    ];

    setAllChats((prev) => {

      const existingChat =
        prev[currentChatId];

      if (!existingChat) return prev;

      return {

        ...prev,

        [currentChatId]: {

          ...existingChat,

          title:
            existingChat.title ===
            "New Chat"
              ? userMessage.slice(0, 25)
              : existingChat.title,

          messages: updatedMessages

        }

      };

    });

    setMessage("");

    try {

      const response = await fetch(
        "https://aegis-ai-research-assistant.onrender.com/chat",
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            message: userMessage,

            history

          })

        }
      );

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let fullText = "";

      while (true) {

        const { done, value } =
          await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value);

        fullText += chunk;

        setAllChats((prev) => {

          const existingChat =
            prev[currentChatId];

          if (!existingChat)
            return prev;

          const msgs =
            existingChat.messages || [];

          const updated =
            [...msgs];

          updated[
            updated.length - 1
          ] = {

            user: userMessage,

            bot: fullText

          };

          return {

            ...prev,

            [currentChatId]: {

              ...existingChat,

              messages: updated

            }

          };

        });

      }

    } catch (err) {

      console.error(err);

      toast.error(
        "Something went wrong"
      );

    }

    setLoading(false);

  };

  // =========================
  // PDF UPLOAD
  // =========================

  const uploadPDF = async () => {

    if (!file) return;

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    try {

      const res =
        await axios.post(
          "https://aegis-ai-research-assistant.onrender.com/upload",
          formData
        );

      toast.success(
        res.data.message
      );

      setPdfFile(res.data.pdf_url);

    } catch (err) {

      toast.error(
        "Upload failed"
      );

    }

  };

  return (

    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">

      <Toaster position="top-right" />

      {/* SIDEBAR */}

      <div className="w-72 hidden md:flex flex-col backdrop-blur-xl bg-white/5 border-r border-white/10">

        <div className="p-5 border-b border-white/10">

          <div className="flex items-center gap-3">

  <div className="bg-blue-600 p-3 rounded-2xl">

    <Bot size={28} />

  </div>

  <div>

    <h1 className="text-3xl font-bold">
      Aegis AI
    </h1>

    <p className="text-gray-400 text-sm">
      Research Assistant
    </p>

  </div>

</div>

          <p className="text-gray-400 text-sm mt-1">
            Research Assistant
          </p>

          <button
            onClick={createNewChat}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-500 transition py-3 rounded-2xl font-semibold"
          >
            + New Chat
          </button>

        </div>

        <div className="flex-1 overflow-y-auto p-3">

          {Object.entries(allChats).map(
            ([id, chat]) => (

              <motion.div
                whileHover={{
                  scale: 1.02
                }}
                key={id}
                onClick={() =>
                  setCurrentChatId(id)
                }
                className={`p-4 rounded-2xl mb-3 cursor-pointer transition ${
                  currentChatId === id
                    ? "bg-white/10"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >

                <div className="flex justify-between items-center gap-2">

                  {

                    editingChatId === id ? (

                      <input
                        value={editingTitle}
                        onChange={(e) =>
                          setEditingTitle(
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {

                          if (
                            e.key === "Enter"
                          ) {

                            saveChatTitle(id);

                          }

                        }}
                        autoFocus
                        className="bg-white/10 text-sm px-2 py-1 rounded-lg outline-none flex-1"
                      />

                    ) : (

                      <p className="truncate text-sm flex-1">
                        {chat.title}
                      </p>

                    )

                  }

                  <div className="flex gap-2">

                    <button
                      onClick={(e) => {

                        e.stopPropagation();

                        setEditingChatId(id);

                        setEditingTitle(
                          chat.title
                        );

                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={(e) => {

                        e.stopPropagation();

                        deleteChat(id);

                      }}
                      className="text-red-400"
                    >
                      ✕
                    </button>

                  </div>

                </div>

              </motion.div>

            )
          )}

        </div>

      </div>

      {/* MAIN + PDF */}

      <div className="flex-1 flex">

        {/* MAIN CHAT */}

        <div className="flex-1 flex flex-col">

          {/* HEADER */}

          <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 p-5">

            <h1 className="text-2xl md:text-3xl font-bold">
              AI Research Assistant
            </h1>

          </div>

          {/* CHAT */}

          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8">

            {currentMessages.map(
              (c, i) => (

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  key={i}
                  className="mb-10"
                >

                  {/* USER */}

                  <div className="flex justify-end mb-4">

                    <div className="bg-blue-600 px-5 py-3 rounded-3xl max-w-xl">

                      {c.user}

                    </div>

                  </div>

                  {/* AI */}

                  <div className="flex justify-start">

                    <div className="backdrop-blur-xl bg-white/10 border border-white/10 px-6 py-5 rounded-3xl max-w-4xl">

                      <div className="prose prose-invert max-w-none">

                        <ReactMarkdown
  remarkPlugins={[
    remarkGfm
  ]}
  components={{

    p({ children }) {

      const text =
        children?.toString() || "";

      const matches =
        [...text.matchAll(/Page (\d+)/g)];

      if (matches.length > 0) {

        return (

          <p>

            {

              text.split(/(Page \d+)/g).map(
                (part, index) => {

                  const match =
                    part.match(/Page (\d+)/);

                  if (match) {

                    return (

                      <span
                        key={index}

                        onClick={() => {

                          setSelectedPage(
                            Number(match[1])
                          );

                          setShowPDF(true);

                        }}

                        className="cursor-pointer text-blue-400 hover:text-blue-300"
                      >
                        {part}
                      </span>

                    );

                  }

                  return (
                    <span key={index}>
                      {part}
                    </span>
                  );

                }
              )

            }

          </p>

        );

      }

      return <p>{children}</p>;

    },

    code({
      className,
      children,
      ...props
    }) {

      const match =
        /language-(\w+)/.exec(
          className || ""
        );

      return match ? (

        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>

      ) : (

        <code
          className={className}
          {...props}
        >
          {children}
        </code>

      );

    }

  }}
>
  {c.bot}
</ReactMarkdown>

                      </div>

                    </div>

                  </div>

                </motion.div>

              )
            )}

            {/* LOADING */}

            {loading && (

  <div className="flex items-center gap-4 ml-4">

    <motion.div

      animate={{
        rotate: [0, 10, -10, 0]
      }}

      transition={{
        repeat: Infinity,
        duration: 1
      }}

      className="bg-blue-600 p-3 rounded-2xl"
    >

      <Bot size={24} />

    </motion.div>

    <div className="flex gap-2">

      <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>

      <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>

      <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>

    </div>

  </div>

)}

          </div>

          {/* INPUT */}

                    {/* INPUT */}

          <div className="p-4 md:p-6 border-t border-white/10 backdrop-blur-xl bg-white/5">

            <div className="flex flex-col md:flex-row gap-3 mb-4">

              <input
                type="file"
                onChange={(e) =>
                  setFile(
                    e.target.files[0]
                  )
                }
                className="text-sm"
              />

              <button
                onClick={uploadPDF}
                className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl transition"
              >
                Upload PDF
              </button>

            </div>

            <div className="flex gap-3">

              <input
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {

                    e.preventDefault();

                    sendMessage();

                  }

                }}
                placeholder="Ask anything..."
                className="flex-1 bg-white/10 border border-white/10 rounded-3xl px-6 py-4 outline-none backdrop-blur-xl"
              />

              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-500 px-7 py-4 rounded-3xl font-semibold transition"
              >
                Send
              </button>

            </div>

          </div>

        </div>

        {/* PDF VIEWER */}

        {
          showPDF && (

            <motion.div

              initial={{
                x: 300,
                opacity: 0
              }}

              animate={{
                x: 0,
                opacity: 1
              }}

              exit={{
                x: 300,
                opacity: 0
              }}

              className="hidden lg:flex w-[40%] border-l border-white/10 bg-white/5 backdrop-blur-xl flex-col"
            >

              <div className="p-4 border-b border-white/10">

                <div className="flex justify-between items-center">

                  <h2 className="font-semibold">
                    PDF Viewer
                  </h2>

                  <button
                    onClick={() =>
                      setShowPDF(false)
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>

                </div>

                <p className="text-sm text-gray-400 mt-2">
                  Page {selectedPage}
                </p>

              </div>

              <div className="flex-1 overflow-auto p-4 flex justify-center">

                {

                  pdfFile ? (

                    <Document
                      file={pdfFile}

                      onLoadSuccess={() =>
                        console.log("PDF loaded")
                      }

                      onLoadError={(err) =>
                        console.log(err)
                      }

                      loading={
                        <p className="text-gray-400">
                          Loading PDF...
                        </p>
                      }
                    >

                      <Page
                        pageNumber={selectedPage}
                        scale={1.2}
                      />

                    </Document>

                  ) : (

                    <div className="text-gray-400 text-sm">

                      No PDF loaded

                    </div>

                  )

                }

              </div>

            </motion.div>

          )
        }

      </div>

    </div>

  );

}

export default App;
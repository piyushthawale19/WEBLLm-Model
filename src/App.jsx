import { useEffect, useState, useRef } from "react"
import * as webllm from "@mlc-ai/web-llm"
import "./app.scss"

function App() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant that can help me with my tasks" }
  ])
  const [engine, setEngine] = useState(null)
  const [loading, setLoading] = useState(true) // ✅ loader for chat responses
  const [initStatus, setInitStatus] = useState({ message: "Connecting to server...", done: false }) // ✅ new state
  const messagesEndRef = useRef(null)

  // ✅ Initialize Model
  useEffect(() => {
    const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"

    webllm.CreateMLCEngine(selectedModel, {
      initProgressCallback: (progress) => {
        console.log("initProgress", progress)
        setInitStatus({ message: progress.text || "Downloading model...", done: false })
      }
    }).then((engine) => {
      setEngine(engine)
      setLoading(false)
      setInitStatus({ message: "✅ Connected with server", done: true }) // ✅ green success message
      setTimeout(() => setInitStatus(null), 2500) // auto-hide after 2.5s
    })

    return () => {
      if (engine) {
        engine.dispose?.()
      }
    }
  }, [])

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ✅ Send Message
  async function sendMessageToLLm() {
    if (!engine) {
      alert("Model not ready yet!")
      return
    }

    const tempMessages = [...messages, { role: "user", content: input }]
    setMessages(tempMessages)
    setInput("")
    setLoading(true)

    try {
      const reply = await engine.chat.completions.create({
        messages: tempMessages,
      })

      console.log("reply", reply)

      const newMessages = [
        ...tempMessages,
        {
          role: "assistant",
          content: reply.choices[0]?.message?.content || "(No reply)"
        }
      ]
      setMessages(newMessages)
    } catch (err) {
      console.error("Error while chatting:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      {/* ✅ Init Popup */}
      {initStatus && (
        <div className={`init-popup ${initStatus.done ? "success" : ""}`}>
          <p>{initStatus.message}</p>
        </div>
      )}

      {/* ✅ Response Loading Popup */}
      {loading && (
        <div className="loading-popup">
          <div className="dots">
            <span></span><span></span><span></span>
          </div>
          <p>Loading response...</p>
        </div>
      )}

      <section>
        <div className="conversation-area">
          <div className="messages">
            {messages
              .filter((msg) => msg.role !== "system")
              .map((message, index) => (
                <div className={`message ${message.role}`} key={index}>
                  {message.content}
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessageToLLm()
                }
              }}
              type="text"
              placeholder="Message LLM"
            />
            <button onClick={sendMessageToLLm}>Send</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

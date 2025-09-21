import { useEffect, useState, useRef } from "react"
import * as webllm from "@mlc-ai/web-llm"
import "./app.scss"

function App() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant that can help me with my tasks" }
  ])
  const [engine, setEngine] = useState(null)
  const [loading, setLoading] = useState(true) // ✅ loader state
  const messagesEndRef = useRef(null)

  // ✅ Initialize Model
  useEffect(() => {
    const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"

    webllm.CreateMLCEngine(selectedModel, {
      initProgressCallback: (initProgress) => {
        console.log("initProgress", initProgress)
      }
    }).then((engine) => {
      setEngine(engine)
      setLoading(false) // ✅ hide loader after model ready
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
    setLoading(true) // ✅ show loader while fetching

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
      setLoading(false) // ✅ hide loader after response
    }
  }

  return (
    <main>
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

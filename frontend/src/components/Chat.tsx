import { useState, useRef, useEffect } from "react";
// import CitationPreview from "./CitationPreview";
import type { ChatMessage } from "../types";
import { chatStream } from "../apis";
import { TypingVisual } from "./TypingVisual";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  // const [highlightChunk, setHighlightChunk] = useState<Citation | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const newestMsgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current && newestMsgRef.current) {
    chatContainerRef.current.scrollTo({
      top: newestMsgRef.current.offsetTop,
      behavior: "smooth",
    });
  }
}, [messages, streamingAnswer]);
  const handleSend = async () => {
    if (!question.trim()) return;

    setStreamingAnswer("");
    // setHighlightChunk(null);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    let aiIndex = 0;
    setMessages((prev) => {
      const newMessages: ChatMessage[] = [
        ...prev,
        { role: "user", text: question },
        { role: "ai", text: "", citations: [] },
      ];
      aiIndex = newMessages.length - 1;
      return newMessages;
    });

    await chatStream(
      question,
      (chunk) => {
        setStreamingAnswer((prev) => prev + chunk);

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[aiIndex] = {
            ...newMessages[aiIndex],
            text: (newMessages[aiIndex].text || "") + chunk,
          };
          return newMessages;
        });
      },
      (cits) => {
        const citationArray = Array.isArray(cits) ? cits : [cits];

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[aiIndex] = {
            ...newMessages[aiIndex],
            citations: [...(newMessages[aiIndex].citations || []), ...citationArray],
          };
          return newMessages;
        });
      },
      abortControllerRef.current.signal
    );

    setQuestion("");
    textareaRef.current?.focus();
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();

    // reset controller so the next request gets a new one
    abortControllerRef.current = new AbortController();
  };

  return (
    <div className="flex flex-col flex-1 pt-4 px-4 h-[80vh] bg-[#FAFAF9]">
      <div ref={chatContainerRef} className="flex-1 rounded p-8 overflow-y-auto mb-2 flex flex-col gap-2 ">
        {messages.length === 0 ? (
          <div className="text-gray-400 italic">
            Ask me about any of your uploaded documents
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role ==="user"
            const isAI = msg.role ==="ai"

            return (
              <>
                <div key={idx} className={`mb-4 ${isUser ? "text-right" : "text-left"}`}>
                  <div className={`inline-block px-2 py-1 rounded whitespace-pre-wrap ${isUser ? "max-w-md bg-[#F1DEDC]" : "max-w-lg bg-[#E5E7EB]"}`}>
                    {/* If assistant message is still streaming, animate */}
                    {isAI && idx === messages.length - 1 && streamingAnswer ? (
                      <TypingVisual text={streamingAnswer} speed={15} />
                    ) : (
                      msg.text
                    )}
                  </div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Sources:
                      <div className="flex gap-3">
                        {Array.from(
                          msg.citations?.reduce((map, c) => {
                            if (!map.has(c.filename)) map.set(c.filename, c);
                            return map;
                          }, new Map<string, typeof msg.citations[0]>())?.values() || []
                        ).map((c, i) => (
                          <div
                            key={i}
                            className="block bg-gray-200 text-gray-600 px-2 py-1"
                            // onClick={() => setHighlightChunk(c)}
                          >
                            {c.filename}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })
        )}
        <div ref={newestMsgRef} />
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 mb-4 px-2 py-1 border rounded bg-white ">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none px-2 py-2 max-h-[12rem] overflow-y-auto focus:outline-none"
          placeholder="Ask a question..."
          value={question}
          rows={1}
          style={{ minHeight: "2.5rem" }}
          onChange={(e) => {
            setQuestion(e.target.value);

            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 192)}px`; // max ~12rem (≈9 lines)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();

              // reset height after submit
              if (textareaRef.current) {
                textareaRef.current.style.height = "2.5rem";
              }
            }
          }}
        />
        <div className="flex gap-2 h-[2.5rem] items-center">
          <button
            className="bg-[#2f1847] h-[2rem] text-white text-sm px-4 py-1 rounded hover:bg-[#2f1847]/80"
            onClick={handleSend}
          >
            Send
          </button>
          <button
            className="bg-gray-500 h-[2rem] text-white text-sm px-4 py-1 rounded hover:bg-gray-700"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Document viewer */}
      {/* {highlightChunk && (
        <CitationPreview
          filename={highlightChunk.filename}
          snippet={highlightChunk.snippet}
        />
      )} */}
    </div>
  );
}
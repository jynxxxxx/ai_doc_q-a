import { useState, useRef } from "react";
import CitationPreview from "./CitationPreview";
import type { ChatMessage, Citation } from "../types";
import { chatStream } from "../apis";
import { TypingVisual } from "./TypingVisual";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [highlightChunk, setHighlightChunk] = useState<Citation | null>(null);
  const textareaRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);


  const handleSend = async () => {
    if (!question.trim()) return;

    setStreamingAnswer("");
    setHighlightChunk(null);

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
    <div className="max-w-2xl mx-auto p-4">
      <div className="border rounded p-8 h-96 overflow-y-auto mb-2 flex flex-col gap-2">
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
                  <div className={`inline-block bg-gray-100 px-2 py-1 rounded whitespace-pre-wrap ${isUser ? "max-w-md" : "max-w-lg"}`}>
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
                          <button
                            key={i}
                            className="block bg-gray-200 text-gray-600 hover:underline px-2 py-1"
                            onClick={() => setHighlightChunk(c)}
                          >
                            {c.filename}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2 mb-4">
        <input
          ref={textareaRef}
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          onClick={handleSend}
        >
          Send
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-700"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      {/* Document viewer */}
      {highlightChunk && (
        <CitationPreview
          filename={highlightChunk.filename}
          snippet={highlightChunk.snippet}
        />
      )}
    </div>
  );
}
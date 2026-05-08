import { useState, useRef, useEffect, useCallback } from 'react';

const CHAT_STORAGE_KEY = 'chat_history';
const MAX_MESSAGES = 30;

function buildSystemPrompt(issData, articles) {
  const { currentPos, speed, locationName, positionCount, astronautCount, astronauts } = issData;
  const lat = currentPos?.lat?.toFixed(4) ?? 'N/A';
  const lng = currentPos?.lng?.toFixed(4) ?? 'N/A';
  const timestamp = currentPos?.timestamp
    ? new Date(currentPos.timestamp * 1000).toUTCString()
    : 'N/A';

  const newsSection = articles
    .slice(0, 10)
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title} — ${a.description}`)
    .join('\n');

  const astronautList = astronauts
    .map((a) => `${a.name} (${a.craft})`)
    .join(', ') || 'Data unavailable';

  return `You are ANTIGRAVITY AI, an assistant for the Antigravity ISS Dashboard.
You ONLY answer questions based on the following real-time dashboard data.
Do NOT use outside knowledge. If the answer is not in the data, respond:
'I can only answer based on current dashboard data. That information is not available.'

=== CURRENT ISS DATA ===
Position: Latitude ${lat}, Longitude ${lng}
Speed: ${speed} km/h
Location: ${locationName}
Positions tracked: ${positionCount}
Last updated: ${timestamp}

=== PEOPLE IN SPACE ===
Total: ${astronautCount} people currently in space
Names: ${astronautList}

=== LATEST NEWS (${articles.length} articles) ===
${newsSection || 'No news data available.'}

Answer ONLY questions about: ISS location, speed, astronauts, or these news articles.
Keep answers under 150 words. Be factual and precise. No hallucination.`;
}

function readChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveChatHistory(messages) {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — silently ignore
  }
}

export default function ChatBot({ issData, articles, addToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => readChatHistory());
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Persist chat history
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg].slice(-MAX_MESSAGES);
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const systemPrompt = buildSystemPrompt(issData, articles);
      const conversationHistory = updatedMessages.slice(-10).map(({ role, content }) => ({
        role,
        content,
      }));

      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_AI_TOKEN}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mistral-7B-Instruct-v0.2:featherless-ai',
          max_tokens: 300,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
          ],
        }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || 'No response received.';

      const aiMsg = { role: 'assistant', content: reply, timestamp: Date.now() };
      setMessages((prev) => [...prev, aiMsg].slice(-MAX_MESSAGES));

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: `⚠ Error: ${err.message || 'Failed to reach AI.'}`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg].slice(-MAX_MESSAGES));
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, messages, issData, articles, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    addToast?.('Chat history cleared', 'info');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toTimeString().slice(0, 5);
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-[1000] flex flex-col animate-slide-up"
          style={{
            width: 'min(400px, calc(100vw - 32px))',
            height: 'min(560px, calc(100vh - 120px))',
            background: 'rgba(8, 14, 30, 0.97)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.15), 0 20px 60px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
              background: 'rgba(0, 212, 255, 0.05)',
              borderRadius: '16px 16px 0 0',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
                  boxShadow: '0 0 12px rgba(0, 212, 255, 0.4)',
                }}
              >
                ⚡
              </div>
              <div>
                <div className="font-orbitron font-bold text-sm tracking-wider" style={{ color: '#00D4FF' }}>
                  ANTIGRAVITY AI
                </div>
                <div className="text-xs font-space-grotesk" style={{ color: 'rgba(148,163,184,0.6)' }}>
                  Mistral-7B • Dashboard Data Only
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-red-500/20"
                style={{ color: 'rgba(148,163,184,0.6)' }}
                title="Clear chat"
              >
                🗑
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-white/10"
                style={{ color: 'rgba(148,163,184,0.6)' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-4xl">📡</div>
                <div className="font-orbitron text-sm" style={{ color: '#00D4FF', opacity: 0.7 }}>
                  ANTIGRAVITY AI
                </div>
                <p className="text-xs font-space-grotesk" style={{ color: 'rgba(148,163,184,0.6)', maxWidth: '240px' }}>
                  Ask me about the ISS position, speed, astronauts, or today&apos;s news.
                </p>
                <div className="flex flex-col gap-2 mt-2 w-full max-w-[260px]">
                  {[
                    'Where is the ISS right now?',
                    'How fast is the ISS moving?',
                    'Who is currently in space?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="text-xs text-left px-3 py-2 rounded-lg transition-all hover:border-cyan-400/60"
                      style={{
                        background: 'rgba(0, 212, 255, 0.05)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        color: 'rgba(0, 212, 255, 0.8)',
                        fontFamily: 'Space Grotesk, sans-serif',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1"
                    style={{
                      background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
                      fontSize: '10px',
                    }}
                  >
                    AI
                  </div>
                )}

                <div
                  className="max-w-[78%] px-3 py-2 rounded-xl text-xs leading-relaxed font-space-grotesk"
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'rgba(124, 58, 237, 0.25)',
                          border: '1px solid rgba(124, 58, 237, 0.35)',
                          color: '#E2E8F0',
                          borderRadius: '12px 12px 2px 12px',
                        }
                      : {
                          background: msg.isError
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(0, 212, 255, 0.05)',
                          border: msg.isError
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid rgba(0, 212, 255, 0.2)',
                          color: msg.isError ? '#FCA5A5' : '#E2E8F0',
                          borderRadius: '2px 12px 12px 12px',
                        }
                  }
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div
                    className="text-right mt-1 text-[10px]"
                    style={{ color: 'rgba(148,163,184,0.4)' }}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00D4FF, #7C3AED)' }}
                >
                  AI
                </div>
                <div
                  className="px-4 py-3 rounded-xl flex items-center gap-1.5"
                  style={{
                    background: 'rgba(0, 212, 255, 0.05)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: '2px 12px 12px 12px',
                  }}
                >
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(0, 212, 255, 0.12)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about ISS, astronauts, news..."
              disabled={isTyping}
              className="flex-1 px-3 py-2 text-xs rounded-lg outline-none font-space-grotesk transition-all"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                color: '#E2E8F0',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0, 212, 255, 0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(0, 212, 255, 0.2)')}
            />
            <button
              id="chat-send-btn"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background:
                  inputValue.trim() && !isTyping
                    ? 'linear-gradient(135deg, #00D4FF, #0099BB)'
                    : 'rgba(0, 212, 255, 0.1)',
                color: inputValue.trim() && !isTyping ? '#020817' : 'rgba(0, 212, 255, 0.3)',
                boxShadow:
                  inputValue.trim() && !isTyping ? '0 0 15px rgba(0, 212, 255, 0.4)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-[1001] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: isOpen
            ? 'rgba(0, 212, 255, 0.2)'
            : 'linear-gradient(135deg, #00D4FF, #0088AA)',
          border: '2px solid rgba(0, 212, 255, 0.5)',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.15)',
          animation: isOpen ? 'none' : 'glowPulse 2s ease-in-out infinite',
        }}
        aria-label="Toggle AI Chatbot"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <span style={{ fontSize: '22px', lineHeight: 1 }}>📡</span>
        )}

        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-orbitron"
            style={{
              background: '#F43F5E',
              color: 'white',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
    </>
  );
}

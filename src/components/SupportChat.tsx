import React, { useState, useEffect, useRef } from "react";
import { UserProfile, ChatMessage } from "../types";
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX, Sparkles, HelpCircle, AlertCircle, RefreshCw, AlertTriangle, ArrowUpRight } from "lucide-react";

interface SupportChatProps {
  user: UserProfile;
  currentBookTitle?: string;
  onActivityLog: (action: string, details: string) => void;
}

export default function SupportChatComponent({
  user,
  currentBookTitle,
  onActivityLog,
}: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Advanced AI Flags
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [sentimentStatus, setSentimentStatus] = useState<"positive" | "neutral" | "negative">("neutral");
  const [escalated, setEscalated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Pre-loaded FAQ suggestions for auto-suggestions
  const preloadedQuestions = [
    "How do I read a book online?",
    "Are my notes saved automatically?",
    "What are the subscription plans?",
    "How do I reset my password?",
    "What are the physical operating hours?"
  ];

  // Welcome Messages on mount
  useEffect(() => {
    const welcomeMsgs: ChatMessage[] = [
      {
        id: "welcome-1",
        sender: "bot",
        text: `Hello ${user.name}! I'm Sarah, your virtual E-Library representative. 🌸`,
        timestamp: new Date().toISOString()
      },
      {
        id: "welcome-2",
        sender: "bot",
        text: "I'm available 24/7 to help you read online, update credentials, manage your subscription plan, or explain our features. What can I do for you today?",
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(welcomeMsgs);

    // Setup speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        onActivityLog("Voice Dictation", "Used Voice-to-Text mic input in Support Chat.");
      };
      recognitionRef.current = recognition;
    }
  }, [user.name]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle typing auto-suggestions
  useEffect(() => {
    if (inputText.trim().length > 2) {
      const query = inputText.toLowerCase();
      const filtered = preloadedQuestions.filter(q => q.toLowerCase().includes(query));
      setAutoSuggestions(filtered.slice(0, 3));
    } else {
      setAutoSuggestions([]);
    }
  }, [inputText]);

  // Text to Speech Voice engine
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    try {
      window.speechSynthesis.cancel(); // Stop current speech
      const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, ""); // Strip emojis for cleaner speech
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Slightly higher pitch for Sarah's persona
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech Synthesis error:", err);
    }
  };

  // Toggle Dictation voice input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Submit message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setAutoSuggestions([]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages,
          userId: user.uid,
          userName: user.name,
          userActivity: currentBookTitle ? `Reading "${currentBookTitle}"` : "Browsing Library Catalog"
        })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Chatbot API error");

      // Simulate human response delay
      setTimeout(() => {
        setIsTyping(false);

        // Update sentiment state
        setSentimentStatus(data.sentiment);

        const botMsg: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          sender: data.escalated ? "human_agent" : "bot",
          text: data.reply,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMsg]);
        speakText(data.reply);

        if (data.escalated && !escalated) {
          setEscalated(true);
          onActivityLog("Escalation", "Support conversation escalated to Live Agent due to negative sentiment.");
          // Send supplementary message from Live Agent joining
          setTimeout(() => {
            const agentJoinMsg: ChatMessage = {
              id: `agent-join-${Date.now()}`,
              sender: "human_agent",
              text: "Hello, I am James, your live helpdesk representative. I have received Sarah's handoff and I am reviewing your account. I will make sure we get this resolved for you right now!",
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, agentJoinMsg]);
            speakText("Hello, I am James, your live helpdesk representative.");
          }, 1500);
        }
      }, data.delayMs || 1000);

    } catch (err: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: `Sorry! I ran into an issue connecting to my support core. But I can tell you that standard operating hours are Monday to Friday, 8am-8pm!`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-30 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-indigo-500/10"
        id="chat-trigger-button"
      >
        <Bot className="w-6 h-6" />
        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Ask Sarah AI</span>
        {isTyping && (
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
        )}
      </button>

      {/* Floating Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-30 w-full max-w-sm h-[500px] bg-[#0B1528] border border-indigo-950/80 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans" id="chat-floating-panel">
          
          {/* Header */}
          <div className="p-3.5 bg-[#080E1C] border-b border-indigo-950/80 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center border border-indigo-900/40 relative">
                <Bot className="w-5 h-5 text-indigo-400" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#080E1C]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">Sarah AI</span>
                  {escalated && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[7px] font-bold uppercase tracking-wider animate-pulse">
                      Escalated
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block leading-none mt-0.5">Support Desk Representative</span>
              </div>
            </div>

            {/* Voice & TTS Control toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  onActivityLog("Voice Toggle", `Switched Sarah's Text-to-Speech mode ${!voiceEnabled ? "On" : "Off"}.`);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  voiceEnabled ? "bg-white/10 text-indigo-400" : "text-slate-500 hover:text-slate-350"
                }`}
                title={voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-slate-300 hover:text-white border border-indigo-950 rounded bg-slate-850 px-2.5 py-1 transition-colors"
              >
                Hide
              </button>
            </div>
          </div>

          {/* Sentiment Status Warning */}
          {sentimentStatus === "negative" && (
            <div className="bg-red-950/40 border-b border-red-900/50 px-3.5 py-2 flex items-center gap-2 text-[10px] text-red-200 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce shrink-0" />
              <span>Negative sentiment detected. Escalating to live support representative...</span>
            </div>
          )}

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#0E1B35] space-y-3.5">
            {messages.map((m) => {
              const mId = m.id;
              const isBot = m.sender === "bot";
              const isHumanAgent = m.sender === "human_agent";

              return (
                <div
                  key={mId}
                  className={`flex gap-2 max-w-[88%] ${
                    isBot || isHumanAgent ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold shadow-sm ${
                    isHumanAgent 
                      ? "bg-amber-950 border-amber-900/50 text-amber-450" 
                      : isBot 
                        ? "bg-indigo-950 border-indigo-900/40 text-indigo-350" 
                        : "bg-indigo-900/50 border-indigo-800/40 text-indigo-200"
                  }`}>
                    {isHumanAgent ? "J" : isBot ? "S" : "U"}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isHumanAgent
                      ? "bg-[#1C2321]/80 border border-amber-900/40 text-amber-100 rounded-tl-none"
                      : isBot
                        ? "bg-[#172A4E] border border-indigo-900/40 text-slate-100 rounded-tl-none"
                        : "bg-[#4f46e5] text-white rounded-tr-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 max-w-[80%] mr-auto items-center">
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-900/40 flex items-center justify-center text-[10px] text-indigo-350 font-bold">
                  S
                </div>
                <div className="bg-[#172A4E] border border-indigo-900/40 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-0" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Controls & Inputs */}
          <div className="p-3 bg-[#080E1C] border-t border-indigo-950/80 space-y-2.5">
            
            {/* Auto Suggestions list */}
            {autoSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {autoSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 bg-[#172A4E] hover:bg-[#1E3563] border border-indigo-900/40 rounded-full text-[9px] text-indigo-300 font-bold text-left transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowUpRight className="w-3 h-3 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-1.5 items-center">
              {/* Mic dictation */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                  isListening
                    ? "bg-red-950/60 border-red-800 text-red-400 animate-pulse"
                    : "bg-[#0E1B35] border-indigo-900/40 text-slate-400 hover:text-slate-200"
                }`}
                title={isListening ? "Listening... Speak now" : "Use Voice Input Microphone"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Ask Sarah library questions..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                className="flex-1 bg-[#0E1B35] border border-indigo-900/40 rounded-xl py-2 px-3 text-[11px] text-slate-150 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-[#122345] transition-all"
              />

              <button
                type="button"
                onClick={() => handleSendMessage(inputText)}
                className="p-2 bg-[#4f46e5] hover:bg-[#5c53ff] rounded-xl text-white shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center">
              <span className="text-[8px] text-slate-500 font-medium">Real-time Dictation & Speech Synthesis Enabled</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}

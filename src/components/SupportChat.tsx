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
        className="fixed bottom-6 right-6 z-30 p-4 bg-emerald-600 hover:bg-emerald-500 text-slate-100 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer border border-emerald-500/20"
        id="chat-trigger-button"
      >
        <Bot className="w-6 h-6" />
        <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:inline">Ask Sarah AI</span>
        {isTyping && (
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
        )}
      </button>

      {/* Floating Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-30 w-full max-w-sm h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden" id="chat-floating-panel">
          
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-emerald-800 to-teal-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 relative">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-100">Sarah AI</span>
                  {escalated && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase tracking-wider animate-pulse">
                      Live Escalated
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold block">Senior Support Agent</span>
              </div>
            </div>

            {/* Voice & TTS Control toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  onActivityLog("Voice Toggle", `Switched Sarah's Text-to-Speech speech mode ${!voiceEnabled ? "On" : "Off"}.`);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  voiceEnabled ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                }`}
                title={voiceEnabled ? "Text-to-Speech Active (Speaks response)" : "Text-to-Speech Muted"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded bg-slate-950 px-2 py-0.5"
              >
                Hide
              </button>
            </div>
          </div>

          {/* Sentiment Status warning */}
          {sentimentStatus === "negative" && (
            <div className="bg-red-950/60 border-b border-red-500/20 px-3 py-1.5 flex items-center gap-1.5 text-[9px] text-red-300 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span>Negative sentiment detected. Escalating to live staff assistance...</span>
            </div>
          )}

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-950/40 space-y-3">
            {messages.map((m) => {
              const isBot = m.sender === "bot";
              const isHumanAgent = m.sender === "human_agent";

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isBot || isHumanAgent ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold ${
                    isHumanAgent 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                      : isBot 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                        : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}>
                    {isHumanAgent ? "J" : isBot ? "S" : "U"}
                  </div>
                  
                  <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                    isHumanAgent
                      ? "bg-slate-900 border border-amber-500/25 text-slate-200"
                      : isBot
                        ? "bg-slate-900 border border-slate-800 text-slate-200"
                        : "bg-emerald-600 text-slate-100"
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
                <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                  S
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-0" />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Controls & Inputs */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
            
            {/* Auto Suggestions list */}
            {autoSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {autoSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-full text-[9px] text-emerald-400 font-semibold text-left transition-colors flex items-center gap-0.5 cursor-pointer"
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
                    ? "bg-red-500/20 border-red-500/30 text-red-400 animate-pulse"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
                title={isListening ? "Listening... Speak now" : "Use Voice Dictation Mic input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening to spoken voice..." : "Ask Sarah library questions..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />

              <button
                type="button"
                onClick={() => handleSendMessage(inputText)}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-slate-100 shadow transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center">
              <span className="text-[8px] text-slate-500 font-medium">Auto-Suggestions, Sentiment Analysis & Speech Synthesis Active</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}

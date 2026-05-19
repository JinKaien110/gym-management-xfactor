// pages/client/WorkoutRecommendation.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";
import { 
  Dumbbell,
  Send,
  Bot,
  User,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  History
} from "lucide-react";

export default function WorkoutRecommendation() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      content: "Welcome to your AI Workout Recommendation assistant! Describe your fitness goals, preferences, or any limitations to get personalized workout recommendations.",
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendRequest = async () => {
    if (!notes.trim()) {
      error("Please enter some notes or preferences");
      return;
    }

    try {
      setSending(true);
      
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        type: "user",
        content: notes,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      const currentNotes = notes;
      setNotes("");

      // Call API
      const response = await api.post("/ai/workout-recommendation", {
        notes: currentNotes
      });

      // Add loading message
      const loadingMessage = {
        id: Date.now() + 1,
        type: "loading",
        content: "Generating your personalized workout recommendation...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Simulate thinking time (API might take a moment)
      setTimeout(() => {
        // Add AI response
        const aiMessage = {
          id: Date.now() + 2,
          type: "ai",
          content: typeof response.data.recommendation === 'object' 
            ? JSON.stringify(response.data.recommendation) 
            : response.data.recommendation || "I've received your request. Your personalized workout plan is being prepared based on your profile and preferences.",
          recommendation: response.data.recommendation,
          timestamp: new Date()
        };
        
        setMessages(prev => {
          // Remove loading message and add AI response
          return prev.filter(m => m.type !== "loading").concat(aiMessage);
        });
        
        success("Workout recommendation generated successfully!");
      }, 1500);

    } catch (err) {
      console.error("Error requesting recommendation:", err);
      
      const errorMessage = err.response?.data?.message || "Failed to get workout recommendation. Please try again.";
      error(errorMessage);
      
      // Add error message to chat
      const errorMsg = {
        id: Date.now(),
        type: "error",
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendRequest();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: "system",
        content: "Welcome to your AI Workout Recommendation assistant! Describe your fitness goals, preferences, or any limitations to get personalized workout recommendations.",
        timestamp: new Date()
      }
    ]);
    success("Chat cleared");
  };

  const formatMessage = (content) => {
    // Handle JSON content from AI
    try {
      if (typeof content === "object") {
        return JSON.stringify(content, null, 2);
      }
      const parsed = JSON.parse(content);
      return formatWorkoutPlan(parsed);
    } catch {
      return content;
    }
  };

  const formatWorkoutPlan = (plan) => {
    if (!plan || typeof plan !== "object") return formatMessage(plan);

    return (
      <div className="space-y-4">
        {plan.title && (
          <h4 className="text-lg font-bold text-white">{plan.title}</h4>
        )}
        {plan.summary && (
          <p className="text-slate-300">{plan.summary}</p>
        )}
        {plan.weekly_plan && (
          <div className="space-y-3">
            {plan.weekly_plan.map((day, index) => (
              <div key={index} className="p-3 rounded-lg bg-slate-700/30 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-400">{day.day}</span>
                  <span className="text-sm text-slate-400">{day.focus}</span>
                </div>
                {day.exercises && (
                  <ul className="space-y-1">
                    {day.exercises.map((ex, exIndex) => (
                      <li key={exIndex} className="text-sm text-slate-300">
                        <span className="text-white">{ex.name}</span>
                        <span className="text-slate-500"> - </span>
                        <span className="text-cyan-400">{ex.sets}x{ex.reps}</span>
                        {ex.rest_sec && <span className="text-slate-500"> ({ex.rest_sec}s rest)</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {plan.progression && (
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-cyan-400 font-medium">Progression: </span>
            <span className="text-slate-300">{plan.progression}</span>
          </div>
        )}
        {plan.safety_notes && plan.safety_notes.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-400 font-medium">Safety Notes: </span>
            <ul className="mt-1">
              {plan.safety_notes.map((note, index) => (
                <li key={index} className="text-sm text-slate-300">• {note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-50 glass-header">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate("/client/dashboard")}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AI Workout Recommendation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/client/my-workout-history"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="View history"
              >
                <History className="w-5 h-5" />
              </Link>
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Clear chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 overflow-hidden"
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse" : ""
                  }`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === "user" 
                        ? "bg-red-600" 
                        : message.type === "system"
                        ? "bg-blue-600"
                        : message.type === "loading"
                        ? "bg-cyan-600 animate-pulse"
                        : message.type === "error"
                        ? "bg-red-600"
                        : "bg-green-600"
                    }`}>
                      {message.type === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : message.type === "loading" ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : message.type === "error" ? (
                        <AlertCircle className="w-4 h-4 text-white" />
                      ) : message.type === "system" ? (
                        <Clock className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`p-3 rounded-xl ${
                      message.type === "user"
                        ? "bg-red-600/20 border border-red-600/30"
                        : message.type === "system"
                        ? "bg-blue-600/20 border border-blue-600/30"
                        : message.type === "loading"
                        ? "bg-cyan-600/20 border border-cyan-600/30"
                        : message.type === "error"
                        ? "bg-red-600/20 border border-red-600/30"
                        : "bg-slate-700/50 border border-white/10"
                    }`}>
                      {message.type === "ai" && message.recommendation ? (
                        <div className="text-white whitespace-pre-wrap">
                          {typeof message.recommendation === 'object' 
                            ? formatWorkoutPlan(message.recommendation)
                            : message.recommendation
                          }
                        </div>
                      ) : (
                        <p className="text-white whitespace-pre-wrap">
                          {typeof message.content === 'object' 
                            ? JSON.stringify(message.content) 
                            : message.content
                          }
                        </p>
                      )}
                      <span className="text-xs text-slate-500 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-slate-800/30">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your fitness goals, preferences, or any limitations..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition resize-none"
                  rows="3"
                  disabled={sending}
                />
              </div>
              <button
                onClick={handleSendRequest}
                disabled={sending || !notes.trim()}
                className={`p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center ${
                  sending || !notes.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send. You can describe your goals, limitations, or ask for specific workout recommendations.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Custom CSS */}
      <style>{`
        .glass-header {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

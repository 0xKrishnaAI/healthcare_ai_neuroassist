import React, { useState, useRef, useEffect, memo } from 'react';
import { FaCommentMedical, FaTimes, FaRobot, FaUser, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello, I am the NeuroAssist GenAI. How can I assist you with clinical analysis or system queries today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.REACT_APP_GENAI_API_KEY || "AIzaSyCd2qy-3oacliYB0hMjBXkx1KkRZtx6Mqw";
      
      const promptContext = messages.map(m => `${m.role === 'ai' ? 'NeuroAssist' : 'User'}: ${m.text}`).join('\n');
      const prompt = `You are NeuroAssist GenAI, a highly intelligent and professional medical AI assistant specialized in Alzheimer's and Neurological analysis. Keep your responses concise (under 4 sentences if possible), analytical, and professional. 
      
Context:
${promptContext}
User: ${userMsg}
NeuroAssist:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
        })
      });

      const data = await response.json();
      
      let aiResponse = "I am processing your query. There appears to be a network delay.";
      if (data.error) {
        aiResponse = `API Error: ${data.error.message}`;
      } else if (data.candidates && data.candidates.length > 0) {
        aiResponse = data.candidates[0].content.parts[0].text;
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to neural node...' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 z-50 animate-bounce group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : ''}`}
      >
        <FaCommentMedical className="text-white text-2xl group-hover:animate-pulse" />
      </button>

      {/* CHAT WINDOW */}
      <div 
        className={`fixed bottom-6 right-6 w-80 md:w-96 bg-[#050d1a] border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '500px' }}
      >
         {/* HEADER */}
         <div className="bg-gradient-to-r from-cyan-900 to-blue-900 px-4 py-3 border-b border-cyan-500/30 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-cyan-400">
                  <FaRobot className="text-cyan-400 text-sm" />
               </div>
               <div>
                  <h3 className="text-white text-xs font-black uppercase tracking-widest">NeuroAssist AI</h3>
                  <div className="flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                     <span className="text-[9px] text-cyan-200">Online</span>
                  </div>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
               <FaTimes />
            </button>
         </div>

         {/* BODY */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-card/50">
            {messages.map((msg, idx) => (
               <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                     {msg.role === 'user' ? <FaUser size={10} /> : <FaRobot size={10} />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[75%] text-xs leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-black/60 border border-white/5 text-white/90 rounded-tl-none'}`}>
                     {msg.text}
                  </div>
               </div>
            ))}
            {isTyping && (
               <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                     <FaRobot size={10} />
                  </div>
                  <div className="p-3 bg-black/60 border border-white/5 rounded-2xl rounded-tl-none">
                     <FaSpinner className="animate-spin text-cyan-400 text-sm" />
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* FOOTER INPUT */}
         <div className="p-3 border-t border-white/10 bg-[#020508] rounded-b-2xl">
            <form onSubmit={handleSend} className="relative flex items-center">
               <input 
                 type="text" 
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 placeholder="Query the AI..."
                 className="w-full bg-black border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-500/50 outline-none transition-colors"
               />
               <button 
                 type="submit"
                 disabled={isTyping}
                 className="absolute right-1 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
               >
                  <FaPaperPlane size={10} className="-ml-0.5" />
               </button>
            </form>
         </div>
      </div>
    </>
  );
};

export default memo(ChatBot);

import React, { useState, useRef, useEffect, memo } from 'react';
import { FaCommentMedical, FaTimes, FaRobot, FaUser, FaPaperPlane, FaSpinner, FaVolumeUp } from 'react-icons/fa';
import { useApp } from '../context/AppContext';

const ChatBot = () => {
  const { state } = useApp();
  const isHindi = state.language === 'hi';
  
  const defaultHello = isHindi 
    ? 'नमस्ते, मैं NeuroAssist GenAI हूँ। आज मैं आपकी क्लिनिकल एनालिसिस या सिस्टम प्रश्नों में कैसे सहायता कर सकता हूँ?'
    : 'Hello, I am the NeuroAssist GenAI. How can I assist you with clinical analysis or system queries today?';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: defaultHello }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync opening message language dynamically if no chats yet
  useEffect(() => {
    if (messages.length === 1) {
        setMessages([{ role: 'ai', text: defaultHello }]);
    }
  }, [isHindi, defaultHello, messages.length]);

  const speakText = (text, index) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isHindi ? 'hi-IN' : 'en-US';
      utterance.onend = () => setIsPlaying(null);
      setIsPlaying(index);
      window.speechSynthesis.speak(utterance);
    }
  };

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
    const lowerInput = userMsg.toLowerCase();
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Keyword Interception Logic (Enhanced)
    let instantReply = null;
    if (lowerInput.includes('pain') || lowerInput.includes('दर्द')) {
        instantReply = isHindi 
            ? "ऐसा लगता है कि आपको दर्द का अनुभव हो रहा है। यदि यह बना रहता है तो कृपया किसी न्यूरोलॉजिस्ट से परामर्श लें।"
            : "It seems you are experiencing pain. Please consult a neurologist if it persists.";
    } else if (lowerInput.includes('headache') || lowerInput.includes('सिरदर्द')) {
        instantReply = isHindi
            ? "सिरदर्द के कई कारण हो सकते हैं। अपने लक्षणों पर नज़र रखें और किसी विशेषज्ञ से सलाह लें।"
            : "Headaches can have multiple causes. Track your symptoms and consult a specialist.";
    } else if (lowerInput.includes('memory') || lowerInput.includes('याददाश्त')) {
        instantReply = isHindi
            ? "याददाश्त कम होना न्यूरोलॉजिकल समस्याओं का संकेत हो सकता है। मूल्यांकन पर विचार करें।"
            : "Memory loss could be a sign of neurological issues. Consider a clinical evaluation.";
    } else if (lowerInput.includes('alzheimer') || lowerInput.includes('अल्जाइमर')) {
        instantReply = isHindi
            ? "अल्जाइमर रोग एक प्रगतिशील विकार है। हमारा सिस्टम एमआरआई विश्लेषण के माध्यम से जल्दी पता लगाने में मदद करता है।"
            : "Alzheimer's is a progressive disorder. Our system helps in early detection via MRI structural analysis.";
    } else if (lowerInput.includes('scan') || lowerInput.includes('स्कैन')) {
        instantReply = isHindi
            ? "आप विश्लेषण हब (Analysis Hub) में एमआरआई स्कैन अपलोड कर सकते हैं।"
            : "You can upload MRI scans for analysis in the Analysis Hub section.";
    }

    if (instantReply) {
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: instantReply }]);
            setIsTyping(false);
        }, 800);
        return;
    }

    try {
      const apiKey = process.env.REACT_APP_GENAI_API_KEY || "AIzaSyCd2qy-3oacliYB0hMjBXkx1KkRZtx6Mqw";
      
      const promptContext = messages.map(m => `${m.role === 'ai' ? 'NeuroAssist' : 'User'}: ${m.text}`).join('\n');
      const langRule = isHindi ? "\nCRITICAL: You MUST reply in Hindi (हिन्दी) language." : "";
      
      const prompt = `You are NeuroAssist GenAI, a highly intelligent and professional medical AI assistant specialized in Alzheimer's and Neurological analysis. Keep your responses concise (under 4 sentences if possible), analytical, and professional.${langRule}
      
Context:
${promptContext}
User: ${userMsg}
NeuroAssist:`;

      // Upgraded to gemini-2.5-flash-lite (Active Quota verified)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
        })
      });

      const data = await response.json();
      
      let aiResponse = "I am processing your query. There appears to be a network delay.";
      if (data.error) {
        aiResponse = `AI Node Busy: ${data.error.message}`;
      } else if (data.candidates && data.candidates[0].content) {
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
                  <div className={`relative p-3 rounded-2xl max-w-[75%] text-xs leading-relaxed group/msg ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-black/60 border border-white/5 text-white/90 rounded-tl-none pr-8'}`}>
                     {msg.text}
                     {msg.role === 'ai' && (
                         <button 
                            onClick={() => speakText(msg.text, idx)}
                            className={`absolute right-2 bottom-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isPlaying === idx ? 'bg-cyan-500 text-black animate-pulse' : 'bg-white/5 text-cyan-400 opacity-0 group-hover/msg:opacity-100 hover:bg-cyan-500/20'}`}
                            title="Read Aloud"
                         >
                            <FaVolumeUp size={10} />
                         </button>
                     )}
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

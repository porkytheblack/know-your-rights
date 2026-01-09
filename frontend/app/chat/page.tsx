"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { 
  Menu, X, Send, Paperclip, Mic, FileText, 
  Users, Scale, Briefcase, ChevronLeft, Plus, Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ContractAnalysisView from "@/components/ContractAnalysisView";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  timestamp: string;
  analysis?: any;
};

type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  category: "union" | "contract" | "health" | "general";
};

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') || 'general';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get('session_id'));
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  // Sync state with URL params (handles back button, deep links)
  useEffect(() => {
      const paramId = searchParams.get('session_id');
      if (paramId && paramId !== sessionId) {
          setSessionId(paramId);
      }
  }, [searchParams, sessionId]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };





  // Fetch Sessions on Mount
  useEffect(() => {
      fetchSessions();
  }, []);

  const fetchSessions = async () => {
      try {
          const res = await fetch("http://localhost:8000/api/chat/sessions");
          if (res.ok) {
              const data = await res.json();
              setSessions(data);
          }
      } catch (err) {
          console.error("Failed to load sessions", err);
      }
  };

  // Load Session History if session_id is present
  useEffect(() => {
      if (sessionId) {
          loadSessionHistory(sessionId);
      } else {
          // Reset to welcome message if no session
           setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: `Hi! I'm here to help with ${getCategoryLabel(categoryParam)}. How can I assist you today?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
      }
  }, [sessionId, categoryParam]);

  const loadSessionHistory = async (id: string) => {
       setIsLoading(true);
       try {
           const res = await fetch(`http://localhost:8000/api/chat/sessions/${id}`);
           if (res.ok) {
               const history = await res.json();
               // Map history to UI format
               const uiMessages: Message[] = history.map((msg: any, idx: number) => ({
                   id: msg.id || idx.toString(),
                   role: msg.role,
                   content: msg.content,
                   timestamp: new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                   // We might need to persist 'sources' in DB to show them in history. 
                   // For now, history from DB might just be text.
               }));
               setMessages(uiMessages);
           }
       } catch (err) {
           console.error("Failed to load history", err);
       } finally {
           setIsLoading(false);
       }
  };

  const startNewChat = () => {
      setSessionId(null);
      router.push('/chat'); // Clear query params
      setSidebarOpen(false);
  };

  const handleSessionClick = (id: string) => {
      setSessionId(id);
      router.push(`/chat?session_id=${id}`);
      setSidebarOpen(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Uploaded for analysis: ${file.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Ensure we have a session ID
      let currentSessionId = sessionId;
      if (!currentSessionId) {
          try {
             currentSessionId = crypto.randomUUID();
          } catch (e) {
             currentSessionId = Date.now().toString(); // Fallback
          }
          setSessionId(currentSessionId);
          router.replace(`/chat?session_id=${currentSessionId}&category=${categoryParam}`, { scroll: false });
      }

      const formData = new FormData();
      formData.append('file', file);
      if (currentSessionId) {
          formData.append('session_id', currentSessionId);
      }

      try {
          const res = await fetch("http://localhost:8000/api/chat/analyze", {
              method: "POST",
              body: formData,
          });

          if (!res.ok) throw new Error("Analysis failed");

          const analysisResult = await res.json();
          
          const botMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "I've analyzed your document. Here is the risk assessment:",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              analysis: analysisResult
          };
          setMessages((prev) => [...prev, botMsg]);

      } catch (error) {
          console.error(error);
          const errorMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "Sorry, I encountered an error processing your document.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, errorMsg]);
      } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userMsg.content,
            category: categoryParam,
            session_id: sessionId,
            use_web_search: useWebSearch
        }),
      });

      // Reset web search toggle
      if (useWebSearch) {
          setUseWebSearch(false);
      }

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      
      // Always update session ID from server response
      if (data.session_id) {
          if (sessionId !== data.session_id) {
              setSessionId(data.session_id);
              // Use router.replace to update URL without adding history entry for every message, 
              // and ensure useSearchParams hook updates
              router.replace(`/chat?session_id=${data.session_id}&category=${categoryParam}`, { scroll: false });
              fetchSessions(); // Refresh sidebar to show new chat
          }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        sources: data.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
        console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the server.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--gray-50)] overflow-hidden font-[family-name:var(--font-inter)]">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed md:relative z-50 h-full w-[280px] bg-white border-r border-[var(--gray-200)] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-[var(--gray-200)] flex items-center justify-between">
          <span className="font-bold text-[var(--gray-900)]">Recent Chats</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-[var(--gray-500)]">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                    No recent chats.
                </div>
            ) : (
                sessions.map(session => (
                    <SidebarItem 
                        key={session.id}
                        icon={getCategoryIcon(session.category || 'general')}
                        title={session.title || 'Untitled Conversation'}
                        time={new Date(session.created_at).toLocaleDateString()}
                        active={sessionId === session.id}
                        onClick={() => handleSessionClick(session.id)}
                    />
                ))
            )}
        </div>

        <div className="p-4 border-t border-[var(--gray-200)]">
           <button 
             onClick={startNewChat}
             className="flex items-center justify-center w-full py-2.5 px-4 bg-[var(--gray-100)] hover:bg-[var(--gray-200)] text-[var(--gray-900)] rounded-lg font-medium transition-colors text-sm gap-2"
           >
             <Plus size={16} />
             New Chat
           </button>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[var(--gray-200)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-[var(--gray-600)]">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", getCategoryColor(categoryParam))}>
                    {getCategoryIcon(categoryParam)}
                </div>
                <div>
                    <h1 className="font-semibold text-[var(--gray-900)] leading-tight">Labor Rights Assistant</h1>
                    <span className="text-xs text-[var(--gray-500)] font-medium bg-[var(--gray-100)] px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {getCategoryLabel(categoryParam)}
                    </span>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <Link href="/categories" className="text-[var(--primary-blue)] text-sm font-medium hover:underline hidden sm:block">
                Change Topic
             </Link>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[var(--gray-50)]">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[75%]",
                  msg.role === "user" ? "ml-auto items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "p-4 shadow-sm relative text-[15px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-[var(--primary-blue)] text-white rounded-[1rem_1rem_0.25rem_1rem]"
                      : "bg-white border border-[var(--gray-200)] text-[var(--gray-900)] rounded-[1rem_1rem_1rem_0.25rem]"
                  )}
                >
                  <div className={cn(
                        "prose prose-sm max-w-none break-words",
                        msg.role === "user" ? "prose-invert" : "prose-slate"
                  )}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="pl-1">{children}</li>,
                            h1: ({children}) => <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600 bg-gray-50 py-1 rounded-r">{children}</blockquote>,
                            code: ({node, className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !className?.includes('language-') ? (
                                    <code className="bg-black/10 px-1 py-0.5 rounded text-[0.9em] font-mono break-all" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            pre: ({children}) => <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2">{children}</pre>,
                            a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-200 transition-colors">{children}</a>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                  </div>
                  
                  {msg.analysis && <ContractAnalysisView result={msg.analysis} />}

                  {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[var(--gray-200)]/50">
                        <p className="text-xs font-bold mb-2 flex items-center gap-1 opacity-80">
                            📚 Sources Used:
                        </p>
                        <div className="space-y-1">
                            {msg.sources.map((source: any, idx: number) => (
                                <div key={idx} className="text-xs bg-[var(--gray-100)] px-2 py-1.5 rounded text-[var(--gray-700)] flex items-center gap-2 border border-[var(--gray-200)] group hover:bg-[var(--gray-200)] transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-blue)] shrink-0"/>
                                    {source.url ? (
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 hover:underline hover:text-[var(--primary-blue)] transition-colors">
                                            {source.title}
                                        </a>
                                    ) : (
                                        <span className="truncate flex-1">{source.title}</span>
                                    )}
                                    <span className="text-[10px] uppercase tracking-wider opacity-60 bg-white px-1.5 py-0.5 rounded border border-[var(--gray-200)]">
                                        {source.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                      </div>
                  )}
                </div>
                <span className="text-[11px] text-[var(--gray-400)] mt-1 px-1">
                    {msg.timestamp}
                </span>
              </div>
            ))}
            
            {isLoading && (
               <div className="flex flex-col items-start max-w-[85%]">
                 <div className="bg-white border border-[var(--gray-200)] px-4 py-3 rounded-[1rem_1rem_1rem_0.25rem] shadow-sm flex items-center gap-2">
                    <span className="flex gap-1">
                        <span className="w-2 h-2 bg-[var(--gray-400)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[var(--gray-400)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[var(--gray-400)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-xs text-[var(--gray-500)] font-medium">Thinking...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-[var(--gray-200)] p-4 sm:p-6 sticky bottom-0 z-20">
            <div className="max-w-3xl mx-auto">
                <form 
                    onSubmit={handleSubmit}
                    className="flex items-end gap-3 bg-[var(--gray-50)] border border-[var(--gray-300)] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[var(--primary-blue)]/20 focus-within:border-[var(--primary-blue)] transition-all shadow-sm"
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        accept=".pdf,.docx,.txt" 
                    />
                    
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-200)] rounded-xl transition-colors shrink-0"
                        title="Upload Document"
                    >
                        <Paperclip size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setUseWebSearch(!useWebSearch)}
                        className={cn(
                            "p-2 rounded-xl transition-colors shrink-0",
                            useWebSearch 
                                ? "text-[var(--primary-blue)] bg-[var(--primary-blue)]/10" 
                                : "text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                        )}
                        title={useWebSearch ? "Web Search Enabled" : "Enable Web Search"}
                    >
                        <Globe size={20} />
                    </button>
                    
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-1 bg-transparent border-none outline-none text-[var(--gray-900)] placeholder:text-[var(--gray-400)] py-2.5 min-w-0"
                    />
                    
                    <button type="button" className="p-2 text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-200)] rounded-xl transition-colors shrink-0 md:hidden">
                        <Mic size={20} />
                    </button>

                    <button 
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-[var(--primary-blue)] text-white rounded-xl hover:bg-[var(--primary-blue-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <div className="text-center mt-2.5">
                    <p className="text-[10px] text-[var(--gray-400)]">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[var(--gray-50)] text-[var(--gray-500)]">Loading chat...</div>}>
            <ChatContent />
        </Suspense>
    );
}

function SidebarItem({ icon, title, time, active, onClick }: { icon: any, title: string, time: string, active?: boolean, onClick?: () => void }) {
    return (
        <button 
          onClick={onClick}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
            active 
                ? "bg-[var(--primary-blue-light)]/50 text-[var(--primary-blue-dark)]" 
                : "hover:bg-[var(--gray-100)] text-[var(--gray-700)]"
          )}
        >
            <div className={cn(
                "p-1.5 rounded-lg",
                active ? "bg-white text-[var(--primary-blue)]" : "bg-[var(--gray-200)] text-[var(--gray-500)]"
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{title}</p>
                <p className="text-[10px] opacity-70">{time}</p>
            </div>
        </button>
    )
}

// ... helpers ...
function getCategoryLabel(cat: string) {
    const map: Record<string, string> = {
        'union': 'Union Rights',
        'contract': 'Contract Review',
        'health_safety': 'Health & Safety',
        'general': 'General Employment',
    };
    return map[cat] || 'General Assistance';
}

function getCategoryColor(cat: string) {
    const map: Record<string, string> = {
        'union': 'bg-blue-100 text-blue-600',
        'contract': 'bg-purple-100 text-purple-600',
        'health_safety': 'bg-emerald-100 text-emerald-600',
        'general': 'bg-gray-100 text-gray-600',
    };
    return map[cat] || 'bg-gray-100 text-gray-600';
}

function getCategoryIcon(cat: string) {
     switch(cat) {
        case 'union': return <Users size={20} />;
        case 'contract': return <FileText size={20} />;
        case 'health_safety': return <Scale size={20} />;
        default: return <Briefcase size={20} />;
     }
}

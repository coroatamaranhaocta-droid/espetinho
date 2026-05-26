import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, Clock, Sparkles, MapPin } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'chef';
  text: string;
  timestamp: Date;
}

interface ChatAIProps {
  isOpen: boolean;
  onClose: () => void;
  storePhone?: string;
}

export default function ChatAI({ isOpen, onClose, storePhone = '99984545370' }: ChatAIProps) {
  const [chatStage, setChatStage] = useState<number>(() => {
    const savedStage = localStorage.getItem('lanchebem_chat_stage');
    return savedStage ? parseInt(savedStage, 10) : 0;
  });

  const [customerName, setCustomerName] = useState<string>(() => {
    return localStorage.getItem('lanchebem_chat_customer_name') || '';
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedName = localStorage.getItem('lanchebem_chat_customer_name');
    if (savedName) {
      return [
        {
          id: 'm1',
          sender: 'chef',
          text: `Boa noite, *${savedName}*! Que alegria ter você de volta aqui no Lanchebem! 😊\n\nNavegue pelo nosso **Cardápio de Produtos** aqui ao lado, adicione os melhores espetinhos e acompanhamentos ao seu **carrinho 🛒 e depois conclua o seu pedido**!\n\nSe tiver qualquer dúvida de valores ou quiser dicas do Chef, é só me perguntar aqui! O que vai ser hoje? 🔥🥩`,
          timestamp: new Date()
        }
      ];
    }
    return [
      {
        id: 'm1',
        sender: 'chef',
        text: 'Boa noite! 🌟 Seja muito bem-vindo ao Lanchebem, o churrasco mais saboroso de Coroatá!\n\nComo posso te chamar? Por favor, digite o seu nome para continuarmos o seu atendimento! 😊',
        timestamp: new Date()
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist stage and name
  useEffect(() => {
    localStorage.setItem('lanchebem_chat_stage', chatStage.toString());
  }, [chatStage]);

  useEffect(() => {
    localStorage.setItem('lanchebem_chat_customer_name', customerName);
  }, [customerName]);

  // Auto scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // Check for exit message
    const normalizedText = textToSend.trim().toLowerCase();
    const isExitWord = normalizedText === 'sair' || 
                       normalizedText === 'tchau' || 
                       normalizedText === 'adeus' || 
                       normalizedText === 'encerrar' ||
                       normalizedText === 'exit' ||
                       normalizedText.includes('quero sair') ||
                       normalizedText.includes('encerrar atendimento');

    if (isExitWord) {
      setTimeout(() => {
        const exitMsg: ChatMessage = {
          id: `c-exit-${Date.now()}`,
          sender: 'chef',
          text: `Muito obrigado pelo seu contato, *${customerName || 'Cliente'}*! Foi uma enorme honra falar com você. 😊✨\n\nSe decidir saborear nossos deliciosos espetinhos na brasa ou hambúrgueres especiais, nosso cardápio está sempre à sua disposição. Tenha uma excelente noite e volte sempre ao Lanchebem! 🛵🥩\n\n_Desconectando chat em instantes..._`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, exitMsg]);
        setLoading(false);

        // Auto close after 2.2 seconds
        setTimeout(() => {
          onClose();
        }, 2200);
      }, 750);
      return;
    }

    // Initial onboarding flow
    if (chatStage === 0) {
      setTimeout(() => {
        // Clean up common introductory phrases to get the main name
        const cleaned = textToSend.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        const words = cleaned.split(/\s+/);
        let extracted = words[0];
        
        const lower = cleaned.toLowerCase();
        const patterns = ["meu nome é", "meu nome e", "me chamo", "sou o", "sou a", "me chamam de"];
        for (const pat of patterns) {
          if (lower.includes(pat)) {
            const idx = lower.indexOf(pat) + pat.length;
            const sub = cleaned.substring(idx).trim();
            const subWords = sub.split(/\s+/);
            if (subWords.length > 0 && subWords[0]) {
              extracted = subWords[0];
              break;
            }
          }
        }

        if (extracted) {
          extracted = extracted.charAt(0).toUpperCase() + extracted.slice(1);
        } else {
          extracted = 'Amigo(a)';
        }

        setCustomerName(extracted);
        setChatStage(1);

        const guideMsg: ChatMessage = {
          id: `c-guide-${Date.now()}`,
          sender: 'chef',
          text: `Prazer em te conhecer, *${extracted}*! 🎉\n\nAgora que já nos conhecemos: para pedir suas delícias, por favor **dirija-se ao nosso Cardápio de Produtos** (você pode ver as categorias aqui do lado). Escolha os melhores espetinhos na brasa, guarnições ou bebidas, **adicione-os ao seu carrinho 🛒 e clique para concluir o seu pedido**!\n\nSe tiver qualquer dúvida de preços, ingredientes, combos ou taxa de entrega para Coroatá, pergunte aqui que eu respondo na hora! O que gostaria de comer hoje? 🥩🔥`,
          timestamp: new Date()
        };

        setMessages((prev) => [...prev, guideMsg]);
        setLoading(false);
      }, 950);
      return;
    }

    try {
      // Package chat history
      const formattedHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory,
          customerName: customerName
        })
      });

      const data = await res.json();
      
      const chefMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        sender: 'chef',
        text: data.text || 'Desculpe, tive uma instabilidade ao formular minha sugestão.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, chefMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: `c-err-${Date.now()}`,
          sender: 'chef',
          text: `Estou instável para falar com o servidor agora, ${customerName || 'Amigo(a)'}, mas lembre-se: o nosso espetinho de Contra Filé super macio (R$ 15,00) e a nossa Picanha na brasa (R$ 18,00) estão saindo quentinhos em 30 min para todo o Bairro Mariol de Coroatá! Adicione suas delícias ao carrinho e envie o pedido!`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = (topic: string) => {
    handleSend(topic);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[380px] h-[550px] shadow-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-fade-in" id="chat-ai-panel">
      
      {/* Chat header panel */}
      <div className="bg-rose-600 p-4 shrink-0 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-9 h-9 bg-rose-700 rounded-xl flex items-center justify-center border border-rose-500">
              <Bot className="w-5 h-5 text-rose-100" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-rose-600 rounded-full" />
          </div>
          <div className="text-left">
            <h3 className="font-extrabold text-sm flex items-center gap-1">
              Chef Lanchebem
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            </h3>
            <span className="text-[10px] text-rose-100 font-semibold tracking-wide uppercase">Assistente IA Online</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-rose-700 transition-colors text-rose-100 hover:text-white"
          id="chat-ai-close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50 dark:bg-zinc-950/40 custom-scrollbar flex flex-col"
      >
        {messages.map((m) => {
          const isChef = m.sender === 'chef';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isChef ? 'self-start text-left' : 'self-end flex-row-reverse text-right'
              }`}
            >
              {isChef && (
                <div className="w-6.5 h-6.5 shrink-0 bg-rose-100 dark:bg-rose-950/40 rounded-lg flex items-center justify-center text-rose-650 dark:text-rose-400 text-xs">
                  🤖
                </div>
              )}
              <div>
                <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isChef
                    ? 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-150 dark:border-zinc-800 rounded-tl-none'
                    : 'bg-rose-600 text-white rounded-tr-none font-medium'
                }`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 block px-1">
                  {m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing loading indicators */}
        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%] self-start text-left">
            <div className="w-6.5 h-6.5 shrink-0 bg-rose-100 dark:bg-rose-950/40 rounded-lg flex items-center justify-center text-rose-600 text-xs">
              🤖
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-800 rounded-tl-none shadow-sm flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce delay-75" />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce delay-150" />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce delay-225" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested chips tags */}
      {messages.length === 1 && (
        <div className="px-3 py-2 border-t border-zinc-150 dark:border-zinc-850 shrink-0 bg-white dark:bg-zinc-900 flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSuggest('Quais são os espetinhos bovinos e suínos na brasa?')}
            className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-850 dark:border-zinc-800 border hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-350 transition-colors"
          >
            🥩 Espetinhos na Brasa
          </button>
          <button
            onClick={() => handleSuggest('Quais opções de Combos Promocionais vocês têm?')}
            className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-850 dark:border-zinc-800 border hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-350 transition-colors"
          >
            🔥 Combos Especiais
          </button>
          <button
            onClick={() => handleSuggest('Qual é a taxa de entrega para o Mariol?')}
            className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-850 dark:border-zinc-800 border hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-350 transition-colors"
          >
            🛵 Taxa de Entrega
          </button>
        </div>
      )}

      {/* Send Message Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="p-3 border-t border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pergunte ao Chef..."
          className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500 duration-200"
          id="chat-ai-input"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-2 sm:p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:hover:bg-rose-600"
          id="chat-ai-send"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>

    </div>
  );
}

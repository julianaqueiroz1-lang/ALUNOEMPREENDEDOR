import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, StudentProfile } from '../types';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface ChatTiraDuvidasProps {
  student: StudentProfile;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const ChatTiraDuvidas: React.FC<ChatTiraDuvidasProps> = ({
  student,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Olá, ${student.name.split(' ')[0]}! Sou o **Mentor Virtual do Aluno Empreendedor** 🚀.\n\nEstou aqui para tirar qualquer dúvida sobre as oficinas, Business Model Canvas, precificação financeira, marketing digital, preparação do pitch de 3 minutos, formalização MEI e validação de MVP. Como posso te ajudar hoje?`,
      timestamp: 'Agora',
      source: 'local_mentor',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialQuery) {
      setInputMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery, onClearInitialQuery]);

  const quickQuestions = [
    'Como definir a Proposta de Valor no Canvas?',
    'Como calcular preço de venda sem ter prejuízo?',
    'Qual a estrutura recomendada para o Pitch de 3 min?',
    'Como validar uma ideia com clientes reais (MVP)?',
    'O que preciso saber para formalizar como MEI no Brasil?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          studentName: student.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Dúvida recebida! Continue perseverando em sua jornada empreendedora.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Chat request fallback:', err);
      // Client-side instant helpful fallback
      const fallbackReply = generateFallbackReply(text);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        source: 'local_mentor_fallback',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackReply = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('canvas') || q.includes('proposta de valor')) {
      return `📌 **Business Model Canvas**:
1. **Proposta de Valor**: Não descreva apenas o produto, mas a transformação que ele gera e qual dor crônica você resolve para seu cliente.
2. **Segmento de Clientes**: Quem tem a dor mais urgente? Foque em um nicho bem definido antes de tentar vender para todo mundo.
3. **Canais**: Onde o cliente está? (Instagram, WhatsApp, parcerias presenciais na escola/bairro).
4. **Fontes de Receita**: Venda avulsa, assinatura, comissão ou freemium?`;
    }
    if (q.includes('preço') || q.includes('precificação') || q.includes('custo') || q.includes('lucro')) {
      return `💰 **Dicas de Precificação Empreendedora**:
- **Custo dos Materiais Diretos (CMV)**: Quanto você gasta em insumos em cada unidade.
- **Custos Fixos Prorrateados**: Internet, energia, ferramentas de software.
- **Remuneração da sua mão de obra**: Seu tempo deve ser remunerado, não trabalhe de graça!
- **Margem de Lucro**: O que sobra limpo para o caixa da empresa crescer.
- **Preço de Venda** = (Custos Totais) / (1 - % margem desejada - % impostos).`;
    }
    if (q.includes('pitch') || q.includes('apresentação') || q.includes('banca')) {
      return `🎤 **Roteiro Campeão para Pitch de 3 Minutos**:
- **0:00 - 0:30 (O Gancho & Problema)**: Contextualize a dor real com uma história impactante ou estatística chocante.
- **0:30 - 1:15 (A Solução & Diferencial)**: Demonstre sua solução e por que ela é 10x melhor que o que já existe.
- **1:15 - 2:00 (Mercado & Modelo de Negócio)**: Como você vai faturar e qual o tamanho da oportunidade.
- **2:00 - 2:30 (Validação & Tração)**: O que você já fez (entrevistas, protótipo, pré-vendas, feedback de clientes).
- **2:30 - 3:00 (Equipe & Pedido)**: Quem somos e do que precisamos (mentorias, parcerias, investimento inicial).`;
    }
    if (q.includes('mei') || q.includes('formalizar') || q.includes('cnpj')) {
      return `📋 **Formalização do Aluno como MEI**:
- Gratuito no site oficial **gov.br/empresas-e-negocios**.
- Permite emitir Notas Fiscais para empresas e órgãos públicos.
- Abre portas para contas bancárias PJ com taxas reduzidas e maquininhas de cartão.
- Garante benefícios como aposentadoria e auxílio-doença pelo INSS através do pagamento mensal da guia DAS.`;
    }
    return `💡 **Orientação do Mentor**: Excelente reflexão! Empreendedorismo de sucesso baseia-se na validação empírica contínua. 
Recomendo testar essa hipótese diretamente com 3 a 5 potenciais usuários reais esta semana, registrar os aprendizados nas suas **Atividades Complementares** e trazer os dados para a próxima oficina!`;
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Chat reiniciado! Estou pronto para novas dúvidas sobre suas oficinas e projetos do Aluno Empreendedor.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        source: 'local_mentor',
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900">
                Chat Tira-Dúvidas Empreendedor
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> IA & Mentoria
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tire dúvidas instantâneas sobre Canvas, Finanças, Pitch, Validação e Oficinas.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Limpar Conversa
        </button>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/70">
        <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Perguntas frequentes dos alunos:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90 px-3 py-1.5 rounded-lg transition text-left font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages scroll area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-amber-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs relative group ${
                    isUser
                      ? 'bg-emerald-700 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-70">
                    <span className="font-semibold">
                      {isUser ? student.name.split(' ')[0] : 'Mentor Aluno Empreendedor'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>

                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {msg.source === 'gemini' ? 'Resposta via Gemini AI' : 'Orientação Pedagógica'}
                      </span>
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-1 hover:text-slate-700 transition flex items-center gap-1"
                        title="Copiar resposta"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-600 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Mentor consultando metodologias de negócio...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="input-chat-message"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua dúvida sobre o projeto ou oficina..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
              disabled={isLoading}
            />
            <button
              type="submit"
              id="btn-send-chat"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            O Mentor Virtual apoia a formulação das hipóteses, cálculos de precificação e validação com clientes.
          </p>
        </div>
      </div>
    </div>
  );
};

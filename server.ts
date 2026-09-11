import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Aluno Empreendedor API' });
});

// Chat Tira Dúvidas endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem obrigatória' });
    }

    const ai = getAIClient();
    if (!ai) {
      // Intelligent built-in entrepreneurship mentor response fallback
      return res.json({
        reply: getEntrepreneurshipFallbackReply(message),
        source: 'local_mentor',
      });
    }

    const systemInstruction = `Você é o Mentor Virtual do programa "Aluno Empreendedor", um tutor experiente, didático, encorajador e prático para jovens empreendedores estudantes no Brasil.
Seu papel é tirar dúvidas sobre:
1. Modelagem de Negócios & Business Model Canvas (Proposta de valor, segmentos de clientes, canais, fontes de receita).
2. Validação de ideias e MVP (Mínimo Produto Viável), entrevistas de problemas e soluções.
3. Finanças básicas para empreendedores (Precificação de produtos/serviços, ponto de equilíbrio, fluxo de caixa, custos fixos e variáveis, margem de contribuição).
4. Marketing Digital & Vendas (Funil de vendas, personas, redes sociais para negócios, tráfego orgânico e pago).
5. Formalização no Brasil (MEI, emissão de nota fiscal, CNPJ, tributos simples).
6. Estruturação de Pitch (Pitch de 1 minuto, pitch de 3 minutos para investidores ou banca examinadora).
7. Atividades complementares e projetos práticos.

Diretrizes de resposta:
- Responda em Português do Brasil com linguagem clara, motivadora e estruturada com tópicos objetivos.
- Dê exemplos práticos e aplicáveis a negócios reais de estudantes.
- Mantenha a resposta concisa (2 a 4 parágrafos ou lista em tópicos fácil de ler no celular).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Desculpe, não consegui processar a resposta no momento. Pode reformular sua dúvida?';
    return res.json({ reply, source: 'gemini' });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.json({
      reply: getEntrepreneurshipFallbackReply(req.body?.message || ''),
      source: 'local_mentor_fallback',
    });
  }
});

function getEntrepreneurshipFallbackReply(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('canvas') || q.includes('modelo de negócio')) {
    return '📌 **Dica sobre Business Model Canvas**: O Canvas é dividido em 9 blocos essenciais. Comece sempre pela **Proposta de Valor** (qual dor você resolve?) e pelo **Segmento de Clientes** (para quem você está criando valor?). Em seguida, defina seus canais de entrega e como você se relacionará com o cliente!';
  }
  if (q.includes('mvp') || q.includes('validar') || q.includes('validação')) {
    return '🚀 **Como validar um MVP (Mínimo Produto Viável)**:\n1. Não construa tudo de uma vez: crie a versão mais simples que entrega a promessa principal.\n2. Faça um teste de fumaça (landing page, protótipo no Figma ou venda manual pelo WhatsApp).\n3. Colete feedback de pelo menos 10 potenciais clientes reais antes de investir dinheiro.';
  }
  if (q.includes('preço') || q.includes('precificação') || q.includes('custo') || q.includes('financeiro')) {
    return '💰 **Passo a passo para Precificação de Sucesso**:\n- **Custos Diretos**: matéria-prima + embalagem + tempo de mão de obra.\n- **Custos Fixos proporcionais**: internet, energia, ferramentas.\n- **Margem de Lucro**: valor líquido para reinvestir no negócio.\n- **Pesquisa de Mercado**: confira se o preço está alinhado com o valor percebido pelo cliente.';
  }
  if (q.includes('pitch') || q.includes('apresentação') || q.includes('banca')) {
    return '🎤 **Estrutura de Pitch de Alto Impacto (3 Minutos)**:\n1. **Gancho (30s)**: O problema real e quem sofre com ele.\n2. **Solução (45s)**: O seu produto/serviço e diferencial.\n3. **Mercado e Modelo de Receita (45s)**: Tamanho do mercado e como você ganha dinheiro.\n4. **Tração e Validação (30s)**: Resultados já alcançados.\n5. **Equipe e Pedido (30s)**: Quem faz acontecer e o que você precisa agora.';
  }
  if (q.includes('mei') || q.includes('cnpj') || q.includes('formalizar')) {
    return '📋 **Formalização como MEI (Microempreendedor Individual)**:\n- O cadastro é gratuito no Portal do Empreendedor (gov.br).\n- Limite de faturamento anual atual: até R$ 81.000,00.\n- Garante CNPJ, emissão de Notas Fiscais e benefícios previdenciários (INSS) com pagamento único mensal (DAS).';
  }
  return '💡 **Dica do Mentor Aluno Empreendedor**: Empreender é um processo contínuo de aprendizado, validação rápida e foco na solução da dor do seu cliente. Lembre-se de registrar suas horas nas atividades complementares e acompanhar o cronograma das oficinas!';
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

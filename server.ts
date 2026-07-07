import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Define DB Types directly for backend usage
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedOptions: string[];
  observation?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    reference?: string;
  };
  items: OrderItem[];
  paymentMethod: 'PIX' | 'Dinheiro';
  paymentDetails?: {
    changeFor?: number;
  };
  deliveryFee: number;
  subtotal: number;
  total: number;
  status: 'Recebido' | 'Em preparo' | 'Saiu para entrega' | 'Entregue' | 'Cancelado';
  createdAt: string;
  receiptBase64?: string;
  receiptFileName?: string;
  pixVerified?: boolean;
  deliveryProgress?: number;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isPopular?: boolean;
}

interface DB {
  settings: {
    name: string;
    phone: string;
    address: string;
    deliveryFee: number;
    isOpen: boolean;
    pixKey: string;
    pixReceiverName: string;
    pixCity: string;
    coupons: any[];
    customBanners: any[];
    riders?: any[];
  };
  categories: any[];
  products: Product[];
  orders: Order[];
}

const DB_FILE = path.join(process.cwd(), 'server-db.json');
const SECRET_KEY = process.env.JWT_SECRET || 'lanchebem-secret-key-2026-coroata';

// Initial Database Template
const DEFAULT_DB: DB = {
  settings: {
    name: "Lanchebem",
    phone: "99984545370",
    address: "Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá - MA",
    deliveryFee: 5.00,
    isOpen: true,
    pixKey: "01986157360",
    pixReceiverName: "Lanchebem Ltda",
    pixCity: "Coroata",
    coupons: [
      { code: "BEMVINDO", discountType: "fixed", value: 5.00, minOrderValue: 25.00 },
      { code: "LANCHE10", discountType: "percentage", value: 10, minOrderValue: 30.00 }
    ],
    customBanners: [
      {
        id: "b1",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1200",
        title: "Espetinhos de Churrasco do Mariol",
        subtitle: "O melhor churrasquinho na brasa de Coroatá. Peça e receba quentinho!"
      },
      {
        id: "b2",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200",
        title: "Combos Promocionais de Churrasco",
        subtitle: "Especiais individuais, para casal ou família com super descontos!"
      }
    ],
    riders: [
      { id: "r1", name: "Raimundo Ventura", vehicleModel: "Pop 110i Vermelha", plate: "MA-1020", phone: "(99) 98144-4848" },
      { id: "r2", name: "Manoel Motoboy", vehicleModel: "Honda Fan 160 Preta", plate: "NH-4530", phone: "(99) 98454-5370" }
    ]
  },
  categories: [
    { id: "bovinos", name: "Espetinhos Bovinos", icon: "Flame" },
    { id: "suinos", name: "Espetinhos Suínos", icon: "Flame" },
    { id: "frango", name: "Espetinhos de Frango", icon: "Layers" },
    { id: "acompanhamentos", name: "Acompanhamentos", icon: "ChefHat" },
    { id: "drinks", name: "Refrigerantes & Águas", icon: "CupSoda" },
    { id: "combos", name: "Combos Promocionais", icon: "Sparkles" }
  ],
  products: [
    {
      id: "p1",
      name: "Carne de Gado Tradicional",
      description: "Espetinho de carne bovina perfeitamente temperada e assada na brasa.",
      price: 15.00,
      category: "bovinos",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p2",
      name: "Contra Filé",
      description: "Espetinho de contra filé super macio e especial, grelhado na brasa.",
      price: 15.00,
      category: "bovinos",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p3",
      name: "Picanha",
      description: "Nobre picanha fatiada no espeto e assada com sal grosso direto na brasa.",
      price: 15.00,
      category: "bovinos",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p4",
      name: "Kafta Bovino",
      description: "Carne moída bovina selecionada e temperada com ervas aromáticas assada de forma suculenta.",
      price: 15.00,
      category: "bovinos",
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p5",
      name: "Porco Tradicional",
      description: "Espetinho de carne suína premium, marinada com temperos especiais da casa e assada na brasa.",
      price: 15.00,
      category: "suinos",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p6",
      name: "Costelinha Suína",
      description: "Costelinha de porco suculenta, preparada lentamente e finalizada no fogo forte.",
      price: 15.00,
      category: "suinos",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p7",
      name: "Linguiça Toscana",
      description: "Linguiça toscana tradicional dourada e super suculenta assada na brasa.",
      price: 15.00,
      category: "suinos",
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p8",
      name: "Bacon com Queijo",
      description: "Cubos de queijo coalho envolvidos por generosa fatia de bacon crocante assados na brasa.",
      price: 15.00,
      category: "suinos",
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p9",
      name: "Frango Tradicional",
      description: "Espetinho de frango macio (peito/coxa) temperado assado no ponto certo.",
      price: 15.00,
      category: "frango",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p10",
      name: "Frango com Bacon",
      description: "Deliciosos medalhões de frango suculentos envolvidos em fatias crocantes de bacon.",
      price: 15.00,
      category: "frango",
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p11",
      name: "Coração de Frango",
      "description": "Corações de frango marinados em tempero especial e assados de forma suculenta na brasa.",
      price: 15.00,
      category: "frango",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p12",
      name: "Frango com Queijo",
      description: "Espetinho de frango suculento perfeitamente combinado com queijo derretido.",
      price: 15.00,
      category: "frango",
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p13",
      name: "Farofa",
      description: "Farofa artesanal temperada com manteiga e farinha de mandioca crocante para acompanhar.",
      price: 0.00,
      category: "acompanhamentos",
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p14",
      name: "Vinagrete",
      description: "Vinagrete fresco e picadinho com cebola, tomate e cheiro verde.",
      price: 0.00,
      category: "acompanhamentos",
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p15",
      name: "Arroz Branco",
      description: "Porção generosa de arroz branco soltinho preparado no dia.",
      price: 0.00,
      category: "acompanhamentos",
      image: "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p16",
      name: "Batata Frita",
      description: "Porção de batata palito frita sequinha e super crocante.",
      price: 0.00,
      category: "acompanhamentos",
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p17",
      name: "Molho Especial",
      description: "Molho exclusivo da casa Lanchebem para dar aquele toque especial aos espetinhos.",
      price: 0.00,
      category: "acompanhamentos",
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p18",
      name: "Coca-Cola 2L",
      description: "Refrigerante Coca-Cola tamanho família de 2 Litros gelada.",
      price: 12.00,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p19",
      name: "Guaraná Antarctica 2L",
      description: "Refrigerante de Guaraná Antarctica tamanho família de 2 Litros.",
      price: 10.00,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p20",
      name: "Fanta 2L",
      description: "Refrigerante Fanta Laranja tamanho de 2 Litros.",
      price: 9.50,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p21",
      name: "Sprite 2L",
      description: "Refrigerante Sprite de 2 Litros super refrescante.",
      price: 9.50,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p22",
      name: "Pepsi 2L",
      description: "Refrigerante Pepsi sabor cola de 2 Litros gelada.",
      price: 8.99,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p23",
      name: "Dolly 2L",
      description: "Refrigerante Dolly Guaraná de 2 Litros geladinho.",
      price: 6.99,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p24",
      name: "Schweppes Lata",
      description: "Refrigerante Schweppes sabor Citrus Lata de 350ml.",
      price: 5.00,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p25",
      name: "Kuat 2L",
      description: "Refrigerante Kuat Guaraná de 2 Litros gelada.",
      price: 8.50,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p26",
      name: "Indaiá 500ml",
      description: "Água Mineral Indaiá sem gás em garrafa de 500ml.",
      price: 2.50,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1608885898835-2633005cb22d?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p27",
      name: "Minalba 500ml",
      description: "Água Mineral Minalba sem gás de 500ml.",
      price: 2.99,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1608885898835-2633005cb22d?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p28",
      name: "São Lourenço 500ml",
      description: "Água Mineral São Lourenço Premium sem gás 500ml.",
      price: 3.50,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1608885898835-2633005cb22d?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p29",
      name: "Crystal 500ml",
      description: "Água Mineral Crystal sem gás de 500ml gelada.",
      price: 2.00,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1608885898835-2633005cb22d?auto=format&fit=crop&q=80&w=600",
      isAvailable: true
    },
    {
      id: "p30",
      name: "Combo Individual",
      description: "Deliciosa combinação individual: 2 espetinhos à sua escolha + 1 refrigerante lata geladinho.",
      price: 22.00,
      category: "combos",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p31",
      name: "Combo Casal",
      description: "Perfeito para duas pessoas: 4 espetinhos saborosos + 1 refrigerante família de 2 Litros.",
      price: 48.00,
      category: "combos",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "p32",
      name: "Combo Família",
      description: "O maior e melhor combo de churrasquinho: 10 espetinhos suculentos + 1 refrigerante de 2 Litros + 1 porção de farofa artesanal crocante.",
      price: 110.00,
      category: "combos",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600",
      isAvailable: true,
      isPopular: true
    }
  ],
  "orders": []
};

// Help load database from disk or write default
function readDatabase(): DB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Auto sync product catalog & categories so old/stale data from database is replaced with the churrasquinho catalog
    parsed.categories = DEFAULT_DB.categories;
    parsed.products = DEFAULT_DB.products;
    parsed.settings.customBanners = DEFAULT_DB.settings.customBanners;
    
    // Maintain settings name or overwrite if it is default
    parsed.settings.name = "Lanchebem";

    if (!parsed.settings.riders) {
      parsed.settings.riders = DEFAULT_DB.settings.riders;
    }
    
    fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    return parsed;
  } catch (err) {
    console.error('Error reading datastore file', err);
    return DEFAULT_DB;
  }
}

function writeDatabase(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing datastore file', err);
  }
}

// Global active server storage
let database = readDatabase();

// Security signatures helper for JWT authentication (Native crypto)
function signToken(payload: { username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { username: string; role: string } | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decodedBody.exp < Date.now()) return null;
    return decodedBody;
  } catch (err) {
    return null;
  }
}

// Lazy Gemini API initialization wrapper
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to prompt support Chatbot.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Limit Configured for Base64 File uploads
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // ==================== PUBLIC API ENDPOINTS ====================

  // Store information
  app.get('/api/public/store-info', (req, res) => {
    res.json(database.settings);
  });

  // Get dynamic categories and active products catalog
  app.get('/api/public/products', (req, res) => {
    res.json({
      categories: database.categories,
      products: database.products
    });
  });

  // Submit a customer order
  app.post('/api/public/order', (req, res) => {
    try {
      const { customerName, customerPhone, deliveryAddress, items, paymentMethod, paymentDetails, subtotal, deliveryFee, total } = req.body;

      if (!customerName || !customerPhone || !deliveryAddress || !items || !items.length) {
        return res.status(400).json({ error: 'Dados incompletos do pedido.' });
      }

      const id = `ORD-${1000 + database.orders.length + 1}`;
      const newOrder: Order = {
        id,
        customerName,
        customerPhone,
        deliveryAddress,
        items,
        paymentMethod,
        paymentDetails,
        deliveryFee: Number(deliveryFee) || database.settings.deliveryFee,
        subtotal: Number(subtotal),
        total: Number(total),
        status: 'Recebido',
        createdAt: new Date().toISOString()
      };

      database.orders.unshift(newOrder);
      writeDatabase(database);

      res.status(201).json({ success: true, order: newOrder });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao processar o seu pedido.', details: err.message });
    }
  });

  // Fetch specific order tracker status
  app.get('/api/public/order/:id', (req, res) => {
    const order = database.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    // Remove database internal receipt fields if too heavy for simple polling,
    // but keep base64 status
    const result = {
      ...order,
      hasReceipt: !!order.receiptBase64
    };
    res.json(result);
  });

  // Upload custom receipt
  app.post('/api/public/order/:id/receipt', (req, res) => {
    const { receiptBase64, filename } = req.body;
    if (!receiptBase64) {
      return res.status(400).json({ error: 'O arquivo do comprovante é obrigatório.' });
    }

    const orderIdx = database.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    database.orders[orderIdx].receiptBase64 = receiptBase64;
    database.orders[orderIdx].receiptFileName = filename || 'comprovante.png';
    // When receipt is uploaded, mark pixVerified as false (needs admin confirmation) but change order flow metadata if relevant
    writeDatabase(database);

    res.json({ success: true, message: 'Comprovante anexado com sucesso!' });
  });

  // ==================== CHAT AI ASSISTANT ENDPOINT ====================
  app.post('/api/chat', async (req, res) => {
    const { message, history, customerName } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem vazia registrada.' });
    }

    try {
      const client = getGeminiClient();

      // Compile current menu list to assist Gemini context
      const menuContext = database.products
         .filter(p => p.isAvailable)
         .map(p => `- ${p.name} (R$ ${p.price.toFixed(2)}): ${p.description}`)
         .join('\n');

      const systemPrompt = `Você é o "Chef Virtual lanchebem", o assistente de atendimento inteligente da lanchonete Lanchebem, localizada na Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá - Maranhão. O WhatsApp oficial do estabelecimento é (99) 98454-5370.

O nome do cliente com quem você está falando agora é "${customerName || 'Cliente'}". Chame-o pelo nome com frequência de maneira carinhosa, educada e simpática!

Suas diretrizes de atuação:
1. Seja amigável, acolhedor e atencioso. Use o dialeto simpático do Maranhão se sentir abertura, mas mantenha total clareza profissional.
2. Ajude o cliente a conhecer o cardápio e a escolher produtos.
3. Se perguntarem sobre o endereço, diga exatamente: "Estamos localizados na Segunda Travessa São Rafael s/n, Bairro Mariol, Coroatá - MA."
4. A nossa taxa de entrega padrão em Coroatá é R$ ${database.settings.deliveryFee.toFixed(2)}.
5. O tempo de entrega estimado é de 30 a 50 minutos.
6. Aceitamos pagamentos por PIX (Chave ${database.settings.pixKey}) ou Dinheiro na entrega.
7. Veja nosso CARDÁPIO ATIVO atualmente para recomendar valores e itens com precisão matemática:
${menuContext}

NUNCA invente itens ou preços que não estão acima listados. Se o cliente demonstrar intenção de fechar o pedido, oriente-o a clicar no cardápio na tela, adicionar os itens desejados ao carrinho e finalizar clicando em concluir ou fechar o pedido. Faça suas respostas limpas de até no máximo 120 palavras, focas e sem símbolos excessivos de markdown.`;

      // Structure history nicely for chats API
      // Transform incoming messages list into GoogleGenAI chat parts format
      const chatHistory = (history || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const chat = client.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
        history: chatHistory
      });

      const geminiRes = await chat.sendMessage({ message });
      const text = geminiRes.text;

      res.json({ text, success: true });
    } catch (err: any) {
      console.error('Gemini integration error:', err.message);
      // Beautiful fallback simulation if Gemini api is unconfigured or blocked
      const fallbackReply = `Olá! Sou o Chef Virtual da Lanchebem. No momento estou operando em modo offline porque nosso servidor de inteligência artificial está aguardando as chaves de segurança da API. Mas você pode fazer seu pedido adicionando as delícias do nosso cardápio diretamente no carrinho e clicando em "Enviar pelo WhatsApp"! Estamos abertos e prontos para lhe servir na Segunda Travessa São Rafael s/n, Bairro Mariol!`;
      res.json({ text: fallbackReply, success: false, warning: 'GEMINI_API_KEY_MISSING' });
    }
  });


  // ==================== ADMINISTRATOR ENDPOINTS (PROTECTED) ====================

  // Auth Middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso não autorizado. Faça o login.' });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Chave de acesso inválida ou expirada.' });
    }

    next();
  };

  // Login Administrator
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Standard secure defaults
    if (username === 'admin' && password === 'cta12345') {
      const token = signToken({ username: 'admin', role: 'admin' });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
  });

  // Get Dashboard Stats telemetry
  app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
    const allOrders = database.orders;
    const totalOrders = allOrders.length;
    const paidOrders = allOrders.filter(o => o.paymentMethod === 'PIX' && o.pixVerified || o.status === 'Entregue').length;
    const pendingOrders = allOrders.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado').length;
    
    // Revenue calculations
    const dailyRevenue = allOrders
      .filter(o => {
        if (o.status === 'Cancelado') return false;
        // check if order registered today
        const orderDate = new Date(o.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        return orderDate === todayDate;
      })
      .reduce((sum, o) => sum + o.total, 0);

    // Grouping by Status
    const countsByStatus = {
      'Recebido': 0,
      'Em preparo': 0,
      'Saiu para entrega': 0,
      'Entregue': 0,
      'Cancelado': 0
    };
    allOrders.forEach(o => {
      if (countsByStatus[o.status] !== undefined) {
        countsByStatus[o.status]++;
      }
    });
    const ordersByStatus = Object.entries(countsByStatus).map(([name, value]) => ({ name, value }));

    // Revenue chart last 7 days mockup
    const revenueLast7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayRev = allOrders
        .filter(o => {
          if (o.status === 'Cancelado') return false;
          return new Date(o.createdAt).toDateString() === d.toDateString();
        })
        .reduce((sum, o) => sum + o.total, 0);

      return { date: dateStr, value: dayRev };
    });

    res.json({
      totalOrders,
      paidOrders,
      pendingOrders,
      dailyRevenue,
      ordersByStatus,
      revenueLast7Days
    });
  });

  // List all orders (Dashboard details)
  app.get('/api/admin/orders', requireAdmin, (req, res) => {
    res.json(database.orders);
  });

  // Update order status
  app.put('/api/admin/order/:id/status', requireAdmin, (req, res) => {
    const { status, pixVerified } = req.body;
    const orderIdx = database.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (status) {
      database.orders[orderIdx].status = status;
    }
    if (pixVerified !== undefined) {
      database.orders[orderIdx].pixVerified = pixVerified;
    }

    writeDatabase(database);
    res.json({ success: true, order: database.orders[orderIdx] });
  });

  // Edit/add product, coupons & configs
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const { name, description, price, category, image, isAvailable } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name,
      description: description || '',
      price: Number(price),
      category,
      image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
      isAvailable: isAvailable !== false
    };

    database.products.push(newProduct);
    writeDatabase(database);
    res.status(201).json({ success: true, product: newProduct });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const prodIdx = database.products.findIndex(p => p.id === req.params.id);
    if (prodIdx === -1) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const { name, description, price, category, image, isAvailable, isPopular } = req.body;
    database.products[prodIdx] = {
      ...database.products[prodIdx],
      name: name || database.products[prodIdx].name,
      description: description !== undefined ? description : database.products[prodIdx].description,
      price: price !== undefined ? Number(price) : database.products[prodIdx].price,
      category: category || database.products[prodIdx].category,
      image: image || database.products[prodIdx].image,
      isAvailable: isAvailable !== undefined ? !!isAvailable : database.products[prodIdx].isAvailable,
      isPopular: isPopular !== undefined ? !!isPopular : database.products[prodIdx].isPopular,
    };

    writeDatabase(database);
    res.json({ success: true, product: database.products[prodIdx] });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const filteredProds = database.products.filter(p => p.id !== req.params.id);
    if (filteredProds.length === database.products.length) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    database.products = filteredProds;
    writeDatabase(database);
    res.json({ success: true, message: 'Produto excluído com sucesso!' });
  });

  // Settings modification
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const { name, phone, address, deliveryFee, isOpen, pixKey, pixReceiverName, pixCity, coupons, customBanners, riders } = req.body;
    
    database.settings = {
      ...database.settings,
      name: name || database.settings.name,
      phone: phone || database.settings.phone,
      address: address || database.settings.address,
      deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : database.settings.deliveryFee,
      isOpen: isOpen !== undefined ? !!isOpen : database.settings.isOpen,
      pixKey: pixKey || database.settings.pixKey,
      pixReceiverName: pixReceiverName || database.settings.pixReceiverName,
      pixCity: pixCity || database.settings.pixCity,
      coupons: coupons || database.settings.coupons,
      customBanners: customBanners || database.settings.customBanners,
      riders: riders !== undefined ? riders : database.settings.riders,
    };

    writeDatabase(database);
    res.json({ success: true, settings: database.settings });
  });


  // ==================== RIDER CHANNELS ====================
  // List orders that are ready for delivery ("Saiu para entrega") or all active orders
  app.get('/api/rider/orders', (req, res) => {
    const activeRiderOrders = database.orders.filter(o => o.status === 'Saiu para entrega' || o.status === 'Em preparo');
    res.json(activeRiderOrders);
  });

  // Update order delivery route progress in real-time
  app.put('/api/rider/order/:id/progress', (req, res) => {
    const orderIdx = database.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    const { progress, riderName, riderPhone, riderVehicle } = req.body;
    database.orders[orderIdx].deliveryProgress = Number(progress) || 0;
    
    if (riderName) database.orders[orderIdx].riderName = riderName;
    if (riderPhone) database.orders[orderIdx].riderPhone = riderPhone;
    if (riderVehicle) database.orders[orderIdx].riderVehicle = riderVehicle;

    // Auto translate status to "Saiu para entrega" if they report active progress under 100, and is currently "Em preparo"
    if (database.orders[orderIdx].status === 'Em preparo' && Number(progress) > 0 && Number(progress) < 100) {
      database.orders[orderIdx].status = 'Saiu para entrega';
    }

    writeDatabase(database);
    res.json({ success: true, order: database.orders[orderIdx] });
  });

  app.put('/api/rider/order/:id/deliver', (req, res) => {
    const orderIdx = database.orders.findIndex(o => o.id === req.params.id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    database.orders[orderIdx].status = 'Entregue';
    database.orders[orderIdx].deliveryProgress = 100;
    writeDatabase(database);
    res.json({ success: true, order: database.orders[orderIdx] });
  });


  // ==================== FRONTEND ASSET ROUTING & VITE MIDDLEWARE ====================

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
    console.log(`Server executing at http://localhost:${PORT}`);
  });
}

startServer();

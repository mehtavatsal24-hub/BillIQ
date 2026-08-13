import React, { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, X, MessageSquare, Zap } from "lucide-react";
import Markdown from "react-markdown";
import { DocumentHistoryItem, PriceHistoryItem, SavedCustomer, SavedSupplier, LineItem, CustomerDetails, DocumentType, BusinessDetails } from "../types";
import { auth } from "../services/firebase";

interface Message {
  role: "user" | "assistant";
  content: string;
  isAction?: boolean;
}

export function getIndustryConfig(industry?: string) {
  const ind = (industry || "").toLowerCase().trim();

  if (ind.includes("chem") || ind.includes("petro") || ind.includes("polymer") || ind.includes("solv") || ind.includes("acid")) {
    return {
      title: "Chemicals Assistant",
      greeting: "Hello! I'm your **Chemicals Assistant**. I can help you with chemical technical specs, purity grades (e.g. AR/LR/HPLC Grade), HSN resolution, and automated ERP workflows.",
      examples: [
        'Add 500 kg of Industrial Grade Acetone 99.5%',
        'Add 25 drums of Caustic Soda Flakes (Sodium Hydroxide)',
        'Set customer to Reliance Chemicals Ltd'
      ]
    };
  }

  if (ind.includes("pharm") || ind.includes("health") || ind.includes("biotech") || ind.includes("med")) {
    return {
      title: "Pharma Assistant",
      greeting: "Hello! I'm your **Pharma & Healthcare Assistant**. I can help you with API specs, dosage packaging, batch numbers, and quick invoice generation.",
      examples: [
        'Add 100 boxes of Paracetamol 500mg Tablets',
        'Add 50 bottles of Amoxicillin Oral Suspension 60ml',
        'Set customer to Apex Healthcare Pvt Ltd'
      ]
    };
  }

  if (ind.includes("textile") || ind.includes("apparel") || ind.includes("garment") || ind.includes("fabric") || ind.includes("yarn")) {
    return {
      title: "Textiles Assistant",
      greeting: "Hello! I'm your **Textile & Fabrics Assistant**. I can help you with GSM specifications, weave patterns, yardages, roll counts, and fast billing.",
      examples: [
        'Add 200 meters of 100% Organic Cotton Fabric 180 GSM',
        'Add 50 rolls of Polyester Twill Denim Blue',
        'Set customer to Vardhman Textiles'
      ]
    };
  }

  if (ind.includes("elec") || ind.includes("auto") || ind.includes("soft") || ind.includes("it") || ind.includes("digit")) {
    return {
      title: "Electronics & Tech Assistant",
      greeting: "Hello! I'm your **Electronics & Technology Assistant**. I can help you with component specs, warranty details, model codes, and quotation workflows.",
      examples: [
        'Add 50 pcs of 12V 2A Regulated Power Adapter',
        'Add 100 units of Microcontroller Board V2',
        'Set customer to TechSolutions India'
      ]
    };
  }

  if (ind.includes("food") || ind.includes("agri") || ind.includes("beverag") || ind.includes("grain")) {
    return {
      title: "Food & Agri Assistant",
      greeting: "Hello! I'm your **Food & Agriculture Assistant**. I can help with batch details, packaging weights, grade specifications, and instant billing.",
      examples: [
        'Add 100 bags of Premium Refined White Sugar 50kg',
        'Add 50 tins of Cold Pressed Mustard Oil 15L',
        'Set customer to Pure Foods Trading'
      ]
    };
  }

  if (ind.includes("const") || ind.includes("build") || ind.includes("real estate") || ind.includes("cemen")) {
    return {
      title: "Construction Assistant",
      greeting: "Hello! I'm your **Construction Materials Assistant**. I can help with rebar sizes, cement grades, delivery challans, and invoices.",
      examples: [
        'Add 50 metric tons of OPC 53 Grade Cement',
        'Add 200 pcs of TMT Steel Rebar 12mm FE500D',
        'Set customer to Apex Builders'
      ]
    };
  }

  if (ind.includes("vehic") || ind.includes("car") || ind.includes("spare")) {
    return {
      title: "Automotive Assistant",
      greeting: "Hello! I'm your **Automotive & Spare Parts Assistant**. I can help with OEM part numbers, vehicle compatibility, and rapid quotes.",
      examples: [
        'Add 20 sets of Heavy Duty Hydraulic Brake Pads',
        'Add 15 pcs of Oil Filter Cartridge XL',
        'Set customer to Speed Motors & Services'
      ]
    };
  }

  if (ind.includes("metal") || ind.includes("steel") || ind.includes("pipe") || ind.includes("hardw") || ind.includes("valve") || ind.includes("fitting") || ind.includes("engin")) {
    return {
      title: "Industrial Hardware Assistant",
      greeting: "Hello! I'm your **Industrial Hardware & Piping Assistant**. I can help with ASME/ASTM standards, dimension tolerances, weight calculations, and instant quotes.",
      examples: [
        'Add 10 pieces of 2 inch Seamless Pipe Sch 40',
        'Add 5 pcs of 3 inch Flange Class 150 WN',
        'Set customer to Tata Steel Limited'
      ]
    };
  }

  const cleanIndustryName = industry && industry !== "Custom / Other Industry" ? industry : "Business";

  return {
    title: `${cleanIndustryName} Assistant`,
    greeting: `Hello! I'm your **${cleanIndustryName} Assistant**. I can help you with cataloging, technical descriptions, HSN resolution, and automated ERP documents.`,
    examples: [
      `Add 10 units of Standard Grade Product`,
      `Add 50 kg of Raw Material Pack`,
      `Set customer to Acme Global Corp`
    ]
  };
}

interface AIChatProps {
  history: DocumentHistoryItem[];
  priceHistory: PriceHistoryItem[];
  customers: SavedCustomer[];
  suppliers: SavedSupplier[];
  business?: BusinessDetails;
  industry?: string;
  letterhead?: string;
  currency?: string;
  exchangeRate?: number;
  onAddItem?: (item: Partial<LineItem>) => void;
  onSetCustomer?: (customer: CustomerDetails) => void;
  onSetDocType?: (type: DocumentType) => void;
  onClearForm?: () => void;
}

const UI_ACTION_TOOLS: any[] = [
  {
    name: "add_line_item",
    description: "Adds a new line item to the current document.",
    parameters: {
      type: "OBJECT",
      properties: {
        description: { type: "STRING", description: "Full technical description of the product" },
        quantity: { type: "NUMBER", description: "Number of units" },
        unit: { type: "STRING", description: "Unit of measure (e.g. NOS, SET, MTR)" },
        rate: { type: "NUMBER", description: "Price per unit" },
        hsn: { type: "STRING", description: "HSN code if known" }
      },
      required: ["description", "quantity"]
    }
  },
  {
    name: "set_customer",
    description: "Sets the buyer/customer details for the current document.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        gstin: { type: "STRING" },
        address: { type: "STRING" },
        email: { type: "STRING" },
        phone: { type: "STRING" }
      },
      required: ["name"]
    }
  },
  {
    name: "change_document_type",
    description: "Changes the current document type (e.g. Quotation, Tax Invoice).",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { 
          type: "STRING", 
          enum: ["Tax Invoice", "Quotation", "Proforma Invoice", "Delivery Challan", "Purchase Order"],
          description: "The type of document to switch to"
        }
      },
      required: ["type"]
    }
  },
  {
    name: "clear_form",
    description: "Clears all items and customer details from the current document.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  }
];

export const AIChat = ({ 
  history, 
  priceHistory, 
  customers, 
  suppliers, 
  business,
  industry, 
  letterhead,
  currency = "INR",
  exchangeRate = 1,
  onAddItem,
  onSetCustomer,
  onSetDocType,
  onClearForm
}: AIChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const industryConfig = getIndustryConfig(industry);

  const [messages, setMessages] = useState<Message[]>(() => {
    const config = getIndustryConfig(industry);
    return [{
      role: "assistant",
      content: `${config.greeting}\n\n**Try saying:**\n${config.examples.map(ex => `• "${ex}"`).join("\n")}`
    }];
  });

  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update initial welcome message when industry changes
  useEffect(() => {
    const config = getIndustryConfig(industry);
    const welcomeMsg = `${config.greeting}\n\n**Try saying:**\n${config.examples.map(ex => `• "${ex}"`).join("\n")}`;

    setMessages(prev => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].role === "assistant" && !prev[0].isAction)) {
        return [{ role: "assistant", content: welcomeMsg }];
      }
      return prev;
    });
  }, [industry]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      let token = "";
      if (auth?.currentUser) {
        try { token = await auth.currentUser.getIdToken(); } catch (e) {}
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages,
          userMessage,
          industry,
          business,
          currency,
          exchangeRate,
          customers: customers.map((c) => c.name),
          history: history.slice(0, 10).map((h) => ({ party: h.customerName, type: h.type, total: h.total })),
          tools: UI_ACTION_TOOLS,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      const functionCalls = data.functionCalls;
      let actionExecuted = false;
      if (functionCalls && Array.isArray(functionCalls) && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const { name, args } = call;
          
          if (name === "add_line_item" && onAddItem) {
            onAddItem(args as any);
            setMessages(prev => [...prev, { role: "assistant", content: `Added item: **${(args as any).description}**` }]);
            actionExecuted = true;
          }
          if (name === "set_customer" && onSetCustomer) {
            onSetCustomer(args as any);
            setMessages(prev => [...prev, { role: "assistant", content: `Set customer to: **${(args as any).name}**` }]);
            actionExecuted = true;
          }
          if (name === "change_document_type" && onSetDocType) {
            onSetDocType((args as any).type);
            setMessages(prev => [...prev, { role: "assistant", content: `Changed document type to: **${(args as any).type}**` }]);
            actionExecuted = true;
          }
          if (name === "clear_form" && onClearForm) {
            onClearForm();
            setMessages(prev => [...prev, { role: "assistant", content: `Document cleared.` }]);
            actionExecuted = true;
          }
        }
      }

      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else if (!actionExecuted) {
        setMessages(prev => [...prev, { role: "assistant", content: "I'm not sure how to help with that." }]);
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="ai-chat-toggle fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] max-w-[400px] h-[72vh] max-h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col border border-zinc-200 overflow-hidden z-[60] animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="p-3 bg-white border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900">{industryConfig.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              const config = getIndustryConfig(industry);
              const welcomeMsg = `${config.greeting}\n\n**Try saying:**\n${config.examples.map(ex => `• "${ex}"`).join("\n")}`;
              setMessages([{ role: "assistant", content: welcomeMsg }]);
            }}
            className="text-xs font-medium text-zinc-500 px-3 py-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Clear
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-zinc-100 p-1.5 rounded-lg transition-colors text-zinc-500">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white">
        {messages.map((m, i) => (
          <div key={i} className={`px-6 py-6 ${m.role === "assistant" ? "bg-zinc-50/50 border-y border-zinc-100/50" : ""}`}>
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="flex-shrink-0 mt-1">
                {m.role === "user" ? (
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                    <User className="h-4 w-4 text-zinc-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                    A
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2 overflow-hidden">
                <div className="font-medium text-[10px] uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>{m.role === "user" ? "You" : "Assistant"}</span>
                </div>
                <div className="text-zinc-700 text-sm leading-relaxed">
                  {m.role === "assistant" ? (
                    <div className="markdown-body">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="px-6 py-6 bg-zinc-50/50 border-y border-zinc-100/50">
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                  A
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-medium text-[10px] uppercase tracking-wider text-zinc-400">Assistant</div>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-3 pt-2 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-1.5 pb-1">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider w-full">Quick Suggestions:</span>
        {industryConfig.examples.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInput(ex)}
            className="text-[11px] font-medium bg-white hover:bg-zinc-900 hover:text-white text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200 shadow-2xs transition-all text-left truncate max-w-full"
          >
            💬 {ex}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-zinc-100">
        <div className="relative max-w-3xl mx-auto">
          <textarea
            value={input ?? ""}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${industryConfig.title}...`}
            className="w-full pl-3 pr-10 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '100px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-zinc-900 text-white rounded-lg disabled:opacity-50 hover:bg-zinc-800 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="text-center mt-1">
          <span className="text-[10px] text-zinc-400">Assistant can make mistakes. Check important info.</span>
        </div>
      </div>
    </div>
  );
};

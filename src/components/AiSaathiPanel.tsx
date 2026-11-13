import React, { useRef, useState } from 'react';
import { Mic, MicOff, Send, Image as ImageIcon, Sparkles, X, Gift, Scale, ShoppingBasket } from 'lucide-react';
import { LanguageCode, Product } from '../types/hub';
import { t } from '../lib/i18n';
import { VedashilaCompactMark } from './BrandMark';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  productIds?: string[];
  followUps?: string[];
}

interface AiSaathiPanelProps {
  language: LanguageCode;
  city: string;
  pincode: string;
  products: Product[];
  isFloating?: boolean;
  onClose?: () => void;
  onOpenProduct: (product: Product) => void;
}

export const AiSaathiPanel: React.FC<AiSaathiPanelProps> = ({
  language,
  city,
  pincode,
  products,
  isFloating = false,
  onClose,
  onOpenProduct,
}) => {
  const [mode, setMode] = useState<'chat' | 'gift' | 'grocery' | 'compare'>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        language === 'hi'
          ? 'नमस्ते! मैं वेदशिला AI साथी हूँ। आप मुझसे साड़ी, गिफ्ट, ऑफिस एक्सेसरीज़, या इंदौर किराना विकल्पों के बारे में पूछ सकते हैं।'
          : 'Namaste! I am VEDASHILA AI SAATHI. Ask me to find sarees under ₹2,000, birthday gifts, office essentials, or Indore grocery options.',
      followUps:
        language === 'hi'
          ? ['₹2,000 के अंदर साड़ी दिखाएं', 'पत्नी के जन्मदिन के लिए उपहार', 'इंदौर किराना विकल्प']
          : ['Find a saree under ₹2,000', 'Birthday gift for my wife', 'Suggest Indore grocery options'],
    },
  ]);

  const catalogueSummary = products
    .filter((p) => p.status === 'published')
    .map((p) => ({
      id: p.id,
      title: language === 'hi' ? p.titleHi : p.titleEn,
      brand: p.brand,
      universeId: p.universeId,
      merchantId: p.merchantId,
      purchaseMode: p.purchaseMode,
      priceInr: p.priceVerified ? p.priceInr : undefined,
      priceVerified: p.priceVerified,
      indoreOnly: p.indoreOnly,
      attributes: p.attributes,
    }));

  const sendMessage = async (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query || loading) return;
    setError(null);
    const userMsg: AiMessage = { id: `u_${Date.now()}`, role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/saathi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          city,
          pincode,
          mode,
          catalogueSummary,
          compareProductIds: compareIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Saathi unavailable');

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          productIds: data.recommendedProductIds || [],
          followUps: data.suggestedFollowUps || [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach VEDASHILA AI SAATHI.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setError('Voice recognition is not supported in this browser. Please type your query below.');
      return;
    }

    try {
      const recognition = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      setListening(true);
      setError(null);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput(transcript);
          sendMessage(transcript);
        }
      };
      recognition.onerror = () => {
        setListening(false);
        setError('Microphone permission denied or unavailable. Text search remains active.');
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result || '');
      setLoading(true);
      setError(null);
      setMessages((prev) => [
        ...prev,
        { id: `u_img_${Date.now()}`, role: 'user', text: `Uploaded image for visual discovery: ${file.name}` },
      ]);
      try {
        const res = await fetch('/api/ai/visual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
            language,
            catalogueSummary,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Visual search failed');
        setMessages((prev) => [
          ...prev,
          {
            id: `a_img_${Date.now()}`,
            role: 'assistant',
            text: `${data.visualSummary}\n\n${data.disclaimer}`,
            productIds: data.matchedProductIds || [],
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Visual discovery failed.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`flex flex-col bg-[#FFFFFF] dark:bg-[#0E2924] border border-[#073D35]/15 dark:border-[#C89A45]/30 rounded-2xl overflow-hidden ${
        isFloating ? 'h-[520px] w-full max-w-md shadow-2xl' : 'min-h-[600px]'
      }`}
    >
      <div className="px-4 py-3 bg-[#073D35] text-[#FFFFFF] flex items-center justify-between gap-3 border-b border-[#C89A45]/30">
        <div className="flex items-center gap-2.5">
          <VedashilaCompactMark className="w-8 h-8 border border-[#C89A45]/50" />
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white">{t(language, 'aiSaathiTitle')}</h3>
            <p className="text-[11px] text-[#F8F2E8]/80">
              {city}
              {pincode ? ` · PIN ${pincode}` : ''}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close VEDASHILA AI SAATHI"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F8F2E8]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-3 py-2 border-b border-[#073D35]/10 dark:border-white/10 flex items-center gap-1 overflow-x-auto bg-[#F8F2E8] dark:bg-[#071A17]">
        {[
          { id: 'chat', label: 'Chat', icon: Sparkles },
          { id: 'gift', label: 'Gift Finder', icon: Gift },
          { id: 'grocery', label: 'Indore Grocery', icon: ShoppingBasket },
          { id: 'compare', label: 'Compare', icon: Scale },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as typeof mode)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                mode === m.id
                  ? 'bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35]'
                  : 'text-[#252525]/80 dark:text-[#F8F2E8]/80 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {mode === 'compare' && (
        <div className="px-4 py-2 border-b border-[#073D35]/10 dark:border-white/10 bg-[#F8F2E8]/60 dark:bg-[#071A17]/60 text-xs">
          <p className="font-medium mb-1.5">Select up to 3 products for factual comparison:</p>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {products.slice(0, 8).map((p) => {
              const selected = compareIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setCompareIds((prev) =>
                      selected ? prev.filter((x) => x !== p.id) : prev.length < 3 ? [...prev, p.id] : prev
                    )
                  }
                  className={`px-2 py-1 rounded border text-[11px] truncate max-w-[160px] ${
                    selected
                      ? 'bg-[#073D35] text-white border-[#073D35] dark:bg-[#C89A45] dark:text-[#073D35] font-semibold'
                      : 'border-[#073D35]/20 dark:border-white/20'
                  }`}
                >
                  {p.titleEn}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-[#073D35] text-[#FFFFFF] dark:bg-[#C89A45] dark:text-[#073D35] font-medium'
                  : 'bg-[#F8F2E8] dark:bg-[#071A17] text-[#252525] dark:text-[#F8F2E8]'
              }`}
            >
              {msg.text}
            </div>

            {msg.productIds && msg.productIds.length > 0 && (
              <div className="mt-2 grid grid-cols-1 gap-2 w-full max-w-[92%]">
                {msg.productIds
                  .map((id) => products.find((p) => p.id === id))
                  .filter((p): p is Product => Boolean(p))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onOpenProduct(p)}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#071A17] hover:border-[#C89A45] text-left"
                    >
                      <span className="text-xs font-medium truncate">
                        {language === 'hi' ? p.titleHi : p.titleEn}
                      </span>
                      <span className="font-mono-num text-xs font-bold text-[#073D35] dark:text-[#C89A45] shrink-0">
                        {p.priceVerified && p.priceInr ? `₹${p.priceInr.toLocaleString('en-IN')}` : 'Merchant Site'}
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {msg.followUps && msg.followUps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.followUps.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => sendMessage(f)}
                    className="text-xs px-2.5 py-1 rounded-md border border-[#073D35]/15 dark:border-white/20 hover:border-[#C89A45] text-[#252525]/85 dark:text-[#F8F2E8]/85"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-xs text-[#073D35] dark:text-[#C89A45] font-semibold">VEDASHILA AI SAATHI is thinking...</div>}
        {error && (
          <div className="p-2.5 rounded-lg bg-[#F47D79]/15 border border-[#F47D79]/50 text-xs text-[#9C2B27] dark:text-[#F47D79]">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-3 border-t border-[#073D35]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#071A17] flex items-center gap-2"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title={t(language, 'visualSearch')}
          aria-label={t(language, 'visualSearch')}
          className="p-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 hover:border-[#C89A45] shrink-0"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleVoiceSearch}
          title={listening ? t(language, 'voiceListening') : t(language, 'voiceStart')}
          aria-label={t(language, 'voiceStart')}
          className={`p-2 rounded-lg border shrink-0 ${
            listening
              ? 'border-[#073D35] bg-[#073D35]/15 text-[#073D35] dark:border-[#C89A45] dark:text-[#C89A45]'
              : 'border-[#073D35]/15 dark:border-white/20 hover:border-[#C89A45]'
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(language, 'aiPlaceholder')}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-transparent text-sm focus:outline-none focus:border-[#C89A45]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="p-2.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

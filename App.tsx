
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  BarChart2, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Search, 
  Bell, 
  ChevronDown,
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Share2,
  TrendingUp,
  Zap
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { AppState, ShortLink, UserProfile } from './types';
import { suggestAlias, analyzeLinkMetadata } from './services/geminiService';

const PROFILES: (UserProfile & { color: string })[] = [
  { id: '1', name: 'Naruto Uzumaki', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Naruto&backgroundColor=f59e0b', color: '#f59e0b' },
  { id: '2', name: 'Goku (Kakarot)', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Goku&backgroundColor=ea580c', color: '#ea580c' },
  { id: '3', name: 'Sasuke Uchiha', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasuke&backgroundColor=1e3a8a', color: '#1e3a8a' },
  { id: '4', name: 'Vegeta Prince', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vegeta&backgroundColor=2563eb', color: '#2563eb' },
  { id: '5', name: 'Monkey D. Luffy', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luffy&backgroundColor=dc2626', color: '#dc2626' },
];

const FastShortsPro: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppState>(AppState.PROFILES);
  const [activeProfile, setActiveProfile] = useState<typeof PROFILES[0] | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedAliases, setSuggestedAliases] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLink, setSelectedLink] = useState<ShortLink | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [redirecting, setRedirecting] = useState<{title: string, color: string} | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let code = params.get('c');
    
    if (code) {
      // Limpa o código de barras extras ou caminhos do repo
      code = code.replace(/\/$/, '').split('/').pop() || '';
      
      const saved = localStorage.getItem('fastshorts_pro_links');
      if (saved) {
        const linksList: ShortLink[] = JSON.parse(saved);
        const link = linksList.find(l => l.shortCode === code || l.alias === code);
        if (link) {
          setRedirecting({ title: link.title, color: PROFILES[Math.floor(Math.random() * PROFILES.length)].color });
          const updatedLinks = linksList.map(l => 
            l.id === link.id ? { ...l, clicks: l.clicks + 1 } : l
          );
          localStorage.setItem('fastshorts_pro_links', JSON.stringify(updatedLinks));
          
          setTimeout(() => {
            window.location.href = link.originalUrl;
          }, 1500);
        } else {
            // Se não achar o código, limpa a URL para mostrar o painel
            window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fastshorts_pro_links');
    if (saved) setLinks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('fastshorts_pro_links', JSON.stringify(links));
  }, [links]);

  const handleProfileSelect = (profile: typeof PROFILES[0]) => {
    setActiveProfile(profile);
    setCurrentPage(AppState.HOME);
  };

  const createProLink = async () => {
    if (!urlInput) return;
    setIsProcessing(true);
    try {
      const metadata = await analyzeLinkMetadata(urlInput);
      const shortCode = aliasInput || Math.random().toString(36).substring(2, 8);
      
      const newLink: ShortLink = {
        id: Date.now().toString(),
        originalUrl: urlInput,
        shortCode,
        alias: aliasInput || undefined,
        createdAt: Date.now(),
        clicks: 0, 
        title: metadata.title,
        category: metadata.category,
        posterUrl: `https://picsum.photos/seed/${Math.random()}/600/900`,
        history: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit' }),
          clicks: 0
        }))
      };

      setLinks(prev => [newLink, ...prev]);
      setUrlInput('');
      setAliasInput('');
      setSuggestedAliases([]);
      setCurrentPage(AppState.CATALOG);
      setSelectedLink(newLink);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiSuggestions = async () => {
    if (!urlInput) return;
    setIsProcessing(true);
    const suggestions = await suggestAlias(urlInput);
    setSuggestedAliases(suggestions);
    setIsProcessing(false);
  };

  const deleteLink = (id: string) => {
    if (confirm("Remover este título do catálogo?")) {
      setLinks(prev => prev.filter(l => l.id !== id));
      if (selectedLink?.id === id) setSelectedLink(null);
    }
  };

  const copyLink = (code: string) => {
    const url = new URL(window.location.href);
    const shortUrl = `${url.origin}${url.pathname}${code}`;
    navigator.clipboard.writeText(shortUrl);
    alert("🎬 Link copiado para sua área de transferência!");
  };

  const themeColor = activeProfile?.color || '#E50914';

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="text-6xl font-black mb-12 italic animate-pulse" style={{ color: redirecting.color }}>fastShorts</div>
        <div className="relative w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-8">
           <div className="absolute inset-0 animate-[loading_1.5s_linear_infinite]" style={{ backgroundColor: redirecting.color }}></div>
        </div>
        <h1 className="text-2xl font-black mb-2 uppercase tracking-widest italic">Iniciando Transmissão...</h1>
        <p className="text-gray-400">Título: <span className="text-white font-bold">{redirecting.title}</span></p>
        <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
      </div>
    );
  }

  if (currentPage === AppState.PROFILES) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
        <div className="text-[#E50914] text-5xl font-black mb-16 tracking-tighter italic">fastShorts</div>
        <h1 className="text-3xl md:text-5xl text-white font-medium mb-12 text-center">Quem vai encurtar hoje?</h1>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => handleProfileSelect(p)} className="group flex flex-col items-center gap-4 transition-transform active:scale-95">
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-md overflow-hidden border-4 border-transparent group-hover:border-white transition-all shadow-xl" style={{ backgroundColor: p.color }}>
                <img src={p.avatar} className="w-full h-full object-cover bg-black/20" alt={p.name} />
              </div>
              <span className="text-gray-400 text-lg group-hover:text-white">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <nav className={`fixed top-0 w-full z-[100] transition-all px-4 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-[#141414] shadow-2xl' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
        <div className="text-3xl font-black italic cursor-pointer" style={{ color: themeColor }} onClick={() => setCurrentPage(AppState.HOME)}>fastShorts</div>
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentPage(AppState.HOME)} className="text-sm font-bold">Início</button>
          <button onClick={() => setCurrentPage(AppState.CATALOG)} className="text-sm text-gray-400">Catálogo</button>
          <img src={activeProfile?.avatar} className="w-8 h-8 rounded" style={{ backgroundColor: themeColor }} alt="avatar" />
        </div>
      </nav>

      {currentPage === AppState.HOME && (
        <div className="pt-32 px-4 md:px-12">
          <div className="max-w-4xl mx-auto text-center mb-20">
             <h1 className="text-5xl md:text-7xl font-black mb-6 italic uppercase">A Próxima <span style={{ color: themeColor }}>Estreia</span></h1>
             <p className="text-xl text-gray-400 mb-12">O encurtador mais rápido do catálogo ninja.</p>
             
             <div className="bg-black/40 p-8 rounded-2xl border border-white/5 backdrop-blur-xl">
                <input 
                  type="text" 
                  placeholder="Cole o link original aqui..."
                  className="w-full bg-black/60 border-2 border-white/10 rounded-lg py-4 px-6 text-xl mb-4 focus:outline-none focus:border-white transition-all"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Nome personalizado (ex: fastplayer)"
                    className="flex-1 bg-black/60 border border-gray-700 rounded-lg px-4 py-3"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                  />
                  <button 
                    onClick={createProLink}
                    disabled={isProcessing || !urlInput}
                    className="px-12 py-3 rounded-lg font-black text-lg transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: themeColor }}
                  >
                    LANÇAR LINK
                  </button>
                </div>
                <button onClick={handleAiSuggestions} className="mt-4 text-xs text-gray-500 hover:text-white flex items-center gap-2 mx-auto uppercase tracking-widest">
                   <Sparkles className="w-4 h-4" style={{ color: themeColor }} /> Sugestões de IA
                </button>
             </div>
          </div>
          
          <div className="pb-20">
             <h2 className="text-2xl font-black mb-8 italic">CONTINUAR ASSISTINDO (MEUS LINKS)</h2>
             <div className="flex gap-4 overflow-x-auto pb-6">
                {links.map(link => (
                  <div key={link.id} onClick={() => { setSelectedLink(link); setCurrentPage(AppState.CATALOG); }} className="flex-none w-48 aspect-[2/3] rounded-lg overflow-hidden relative cursor-pointer hover:scale-105 transition-transform border border-white/5">
                    <img src={link.posterUrl} className="w-full h-full object-cover" alt="Poster" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
                       <p className="font-bold uppercase text-xs truncate">{link.title}</p>
                       <p className="text-[10px]" style={{ color: themeColor }}>/{link.alias || link.shortCode}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {currentPage === AppState.CATALOG && (
        <div className="pt-28 px-4 md:px-12">
           <h2 className="text-4xl font-black italic mb-12">GERENCIAR PRODUÇÕES</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {links.map(link => (
                <div key={link.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all">
                   <div className="aspect-video relative">
                      <img src={`https://picsum.photos/seed/${link.id}/600/340`} className="w-full h-full object-cover" alt="Thumb" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity">
                         <button onClick={() => copyLink(link.alias || link.shortCode)} className="bg-white text-black p-3 rounded-full"><Copy className="w-5 h-5" /></button>
                         <button onClick={() => deleteLink(link.id)} className="bg-red-600 text-white p-3 rounded-full"><Trash2 className="w-5 h-5" /></button>
                      </div>
                   </div>
                   <div className="p-4">
                      <h3 className="font-bold uppercase truncate">{link.title}</h3>
                      <p className="text-sm font-bold mt-2" style={{ color: themeColor }}>/{link.alias || link.shortCode}</p>
                      <p className="text-[10px] text-gray-500 mt-4 uppercase font-black">CLIQUES: {link.clicks}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default FastShortsPro;

import React, { useState, useEffect, useRef } from 'react';
import { 
  AppView, 
  VoiceOption, 
  HistoryItem, 
  SUPPORTED_LANGUAGES, 
  VOICES,
  User 
} from './types';
import { GeminiService } from './services/geminiService';
import { AuthService } from './services/authService';
import { AudioPlayer } from './components/AudioPlayer';
import { AuthScreen } from './components/AuthScreen';
import { 
  Mic, 
  Settings, 
  History, 
  LayoutGrid, 
  Wand2, 
  PlayCircle,
  Menu,
  X,
  Languages,
  Save,
  Trash2,
  ExternalLink,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Star,
  Shield
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.SPLASH);
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // TTS State
  const [text, setText] = useState('');
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0); // -10 to 10
  const [emotion, setEmotion] = useState('Neutral');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  
  const geminiService = useRef<GeminiService>(new GeminiService(''));
  const authService = useRef<AuthService>(new AuthService());

  // Init & Auth Check
  useEffect(() => {
    const initAuth = async () => {
      // Simulate splash time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUser = await authService.current.getCurrentUser();
      if (currentUser) {
        handleUserLogin(currentUser);
      } else {
        setView(AppView.AUTH);
      }
    };
    initAuth();
  }, []);

  const handleUserLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    // Configure Services with User Data
    if (loggedInUser.apiKey) {
      geminiService.current.updateApiKey(loggedInUser.apiKey);
    }
    
    setView(AppView.HOME);
  };

  const handleLogout = async () => {
    await authService.current.logout();
    setUser(null);
    setView(AppView.AUTH);
    setCurrentAudio(null);
    setText('');
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates };
      
      // Persist to storage
      await authService.current.updateUser(updatedUser);
      
      // Update State
      setUser(updatedUser);
      
      // Update services if needed
      if (updates.apiKey !== undefined) {
        geminiService.current.updateApiKey(updates.apiKey || '');
      }
    } catch (e) {
      console.error("Failed to update user", e);
      alert("Failed to save changes.");
    }
  };

  // Generate
  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (!user?.apiKey) {
      alert("Please configure your API Key in Settings first.");
      setView(AppView.SETTINGS);
      return;
    }

    setIsGenerating(true);
    setCurrentAudio(null);

    try {
      const audioData = await geminiService.current.generateSpeech(
        text, 
        selectedVoice.id,
        selectedLang.name,
        emotion
      );
      
      setCurrentAudio(audioData);
      
      // Add to user history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        textSnippet: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
        language: selectedLang.name,
        voiceName: selectedVoice.name,
        duration: 0, 
        audioData: audioData
      };
      
      const newHistory = [newItem, ...(user.history || [])].slice(0, 20);
      await updateUserProfile({ history: newHistory });
      
    } catch (error) {
      alert("Failed to generate speech. Please check your API Key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!user) return;
    const newHistory = user.history.filter(h => h.id !== id);
    await updateUserProfile({ history: newHistory });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCurrentAudio(item.audioData);
    // Optionally restore text: setText(item.textSnippet);
    setView(AppView.STUDIO);
  };

  const toggleFavoriteVoice = async (voiceId: string) => {
    if (!user) return;
    const currentFavs = user.preferences.favoriteVoices || [];
    const isFav = currentFavs.includes(voiceId);
    
    let newFavs;
    if (isFav) {
      newFavs = currentFavs.filter(id => id !== voiceId);
    } else {
      newFavs = [...currentFavs, voiceId];
    }
    
    await updateUserProfile({ 
      preferences: { ...user.preferences, favoriteVoices: newFavs } 
    });
  };

  // --- Views ---

  if (view === AppView.SPLASH) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center relative bg-black">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?blur=10')] opacity-20 bg-cover"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-black border-2 border-primary shadow-[0_0_50px_rgba(0,240,255,0.4)] flex items-center justify-center animate-pulse-slow mb-6">
                <Mic size={48} className="text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary neon-text tracking-widest">
                NEON<span className="text-white">VOICE</span>
            </h1>
            <p className="mt-4 text-gray-400 font-light tracking-widest uppercase text-sm">Future of Synthesis</p>
        </div>
      </div>
    );
  }

  if (view === AppView.AUTH) {
    return <AuthScreen onLogin={handleUserLogin} />;
  }

  const NavItem = ({ viewTarget, icon: Icon, label }: any) => (
    <button 
      onClick={() => { setView(viewTarget); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 p-3 w-full rounded-xl transition-all duration-300 ${
        view === viewTarget 
          ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-white shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={view === viewTarget ? 'text-primary' : ''} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex text-white font-sans selection:bg-primary/30 selection:text-white">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col p-6 glass-panel border-r border-white/10 fixed h-full z-20">
        <div className="flex items-center gap-2 mb-10">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-glow">
             <Mic size={16} className="text-white" />
           </div>
           <span className="font-display font-bold text-lg tracking-wide">NEONVOICE</span>
        </div>
        
        <nav className="flex-1 space-y-2">
            <NavItem viewTarget={AppView.HOME} icon={LayoutGrid} label="Dashboard" />
            <NavItem viewTarget={AppView.STUDIO} icon={Wand2} label="TTS Studio" />
            <NavItem viewTarget={AppView.LIBRARY} icon={History} label="Library" />
            <NavItem viewTarget={AppView.SETTINGS} icon={Settings} label="Settings" />
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/20">
                <span className="font-bold text-xs">{user?.name.charAt(0)}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition px-2"
           >
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
             <Mic size={16} className="text-white" />
           </div>
           <span className="font-display font-bold text-lg">NEONVOICE</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
            {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 px-6 md:hidden animate-in slide-in-from-top-10">
             <nav className="space-y-4">
                <NavItem viewTarget={AppView.HOME} icon={LayoutGrid} label="Dashboard" />
                <NavItem viewTarget={AppView.STUDIO} icon={Wand2} label="TTS Studio" />
                <NavItem viewTarget={AppView.LIBRARY} icon={History} label="Library" />
                <NavItem viewTarget={AppView.SETTINGS} icon={Settings} label="Settings" />
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 w-full rounded-xl text-red-400 hover:bg-white/5"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
             </nav>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen relative">
        
        {/* Top bar (Desktop) */}
        <div className="hidden md:flex justify-end mb-8">
            <button 
                onClick={() => setView(AppView.SETTINGS)}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition border border-white/10"
            >
                <div className={`w-2 h-2 rounded-full ${user?.apiKey ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-300">{user?.apiKey ? 'System Online' : 'API Key Required'}</span>
            </button>
        </div>

        {view === AppView.HOME && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <h2 className="text-3xl font-display font-bold">Welcome back, {user?.name.split(' ')[0]}.</h2>
                    <p className="text-gray-400">Ready to synthesize reality?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition"></div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Wand2 className="text-primary"/> Quick Create</h3>
                        <p className="text-gray-400 mb-6 text-sm">Jump straight into the studio with default settings.</p>
                        <button 
                            onClick={() => setView(AppView.STUDIO)}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-primary hover:text-black transition flex items-center justify-center gap-2"
                        >
                            Open Studio
                        </button>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 blur-3xl rounded-full group-hover:bg-secondary/30 transition"></div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><History className="text-secondary"/> Recent Generations</h3>
                        <div className="space-y-3">
                            {(user?.history || []).slice(0, 2).map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer" onClick={() => loadFromHistory(item)}>
                                    <div className="truncate text-sm text-gray-300 w-48">{item.textSnippet}</div>
                                    <PlayCircle size={16} className="text-primary" />
                                </div>
                            ))}
                            {(!user?.history || user.history.length === 0) && <p className="text-sm text-gray-500 italic">No history yet.</p>}
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-4">Supported Languages</h3>
                    <div className="flex gap-4 flex-wrap">
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <button 
                                key={lang.code}
                                onClick={() => { setSelectedLang(lang); setView(AppView.STUDIO); }}
                                className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/10 transition flex flex-col items-center min-w-[100px]"
                            >
                                <span className="text-2xl mb-1">{lang.native.charAt(0)}</span>
                                <span className="text-sm text-gray-300">{lang.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {view === AppView.STUDIO && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Left Panel: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-1 rounded-2xl relative group">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text to synthesize..."
                            className="w-full h-64 bg-transparent text-lg p-6 rounded-xl outline-none resize-none placeholder:text-gray-600 font-light"
                            maxLength={1000}
                        />
                        <div className="absolute bottom-4 right-6 text-xs text-gray-500 font-mono">
                            {text.length} / 1000 chars
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Language Selector */}
                         <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Languages size={14}/> Language
                            </label>
                            <div className="relative">
                                <select 
                                    value={selectedLang.code}
                                    onChange={(e) => setSelectedLang(SUPPORTED_LANGUAGES.find(l => l.code === e.target.value) || SUPPORTED_LANGUAGES[0])}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 appearance-none outline-none focus:border-primary/50 text-white"
                                >
                                    {SUPPORTED_LANGUAGES.map(l => (
                                        <option key={l.code} value={l.code} className="bg-slate-900">{l.name} ({l.native})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
                            </div>
                         </div>

                         {/* Voice Selector */}
                         <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Mic size={14}/> Voice
                            </label>
                             <div className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                  <select 
                                      value={selectedVoice.id}
                                      onChange={(e) => setSelectedVoice(VOICES.find(v => v.id === e.target.value) || VOICES[0])}
                                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 appearance-none outline-none focus:border-primary/50 text-white"
                                  >
                                      {VOICES.map(v => (
                                          <option key={v.id} value={v.id} className="bg-slate-900">{v.name} • {v.gender} ({v.style})</option>
                                      ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
                                </div>
                                <button 
                                  onClick={() => toggleFavoriteVoice(selectedVoice.id)}
                                  className={`p-3 rounded-lg border border-white/10 transition ${
                                    user?.preferences.favoriteVoices.includes(selectedVoice.id) 
                                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' 
                                      : 'bg-black/20 text-gray-500 hover:text-white'
                                  }`}
                                  title="Add to Favorites"
                                >
                                  <Star size={18} fill={user?.preferences.favoriteVoices.includes(selectedVoice.id) ? "currentColor" : "none"} />
                                </button>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Right Panel: Controls & Output */}
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                        <h3 className="font-display font-bold text-lg flex items-center gap-2 text-primary">
                            <Settings size={18} /> Fine Tuning
                        </h3>
                        
                        {/* Emotion */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Emotion Style</span>
                                <span className="text-primary">{emotion}</span>
                            </div>
                            <input 
                                type="range" min="0" max="4" step="1"
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                onChange={(e) => {
                                    const emotions = ['Calm', 'Energetic', 'Cinematic', 'Angry', 'Sad'];
                                    setEmotion(emotions[parseInt(e.target.value)]);
                                }}
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 uppercase">
                                <span>Calm</span>
                                <span>Sad</span>
                            </div>
                        </div>

                         {/* Speed */}
                         <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Speed</span>
                                <span className="text-primary">{speed}x</span>
                            </div>
                            <input 
                                type="range" min="0.5" max="2.0" step="0.1" value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-secondary"
                            />
                        </div>

                        {/* Pitch */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Pitch</span>
                                <span className="text-primary">{pitch > 0 ? `+${pitch}` : pitch}</span>
                            </div>
                            <input 
                                type="range" min="-10" max="10" step="1" value={pitch}
                                onChange={(e) => setPitch(parseInt(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !text.trim()}
                            className={`w-full py-4 rounded-xl font-display font-bold text-lg tracking-wide shadow-lg transition-all
                                ${isGenerating 
                                    ? 'bg-gray-800 text-gray-500 cursor-wait' 
                                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02]'
                                }
                            `}
                        >
                            {isGenerating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...
                                </span>
                            ) : 'GENERATE SPEECH'}
                        </button>
                    </div>

                    {/* Output Player */}
                    <div className="relative">
                        {currentAudio ? (
                           <div className="animate-in fade-in zoom-in duration-300">
                               <AudioPlayer base64Audio={currentAudio} speed={speed} pitch={pitch} />
                           </div>
                        ) : (
                            <div className="h-48 glass-panel rounded-2xl flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <PlayCircle size={24} className="opacity-50" />
                                </div>
                                <span className="text-sm">Audio output will appear here</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {view === AppView.LIBRARY && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                <h2 className="text-3xl font-display font-bold mb-6">Library</h2>
                {(!user?.history || user.history.length === 0) ? (
                    <div className="text-center py-20 text-gray-500">
                        <History size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No generations yet. Create something amazing!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {user.history.map((item) => (
                            <div key={item.id} className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/20">{item.language}</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">{item.voiceName}</span>
                                        <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-300 line-clamp-1 font-light">{item.textSnippet}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => loadFromHistory(item)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-primary transition"
                                        title="Load in Studio"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button 
                                        onClick={() => deleteHistoryItem(item.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {view === AppView.SETTINGS && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
                <h2 className="text-3xl font-display font-bold mb-8">Settings</h2>
                
                <div className="glass-panel p-8 rounded-2xl space-y-8">
                    {/* User Profile */}
                    <div className="flex items-start gap-4 pb-8 border-b border-white/5">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold border-2 border-white/20">
                         {user?.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold">{user?.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{user?.email}</p>
                          <div className="flex gap-2">
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">Free Plan</span>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Beta User</span>
                          </div>
                      </div>
                      <button 
                         onClick={handleLogout}
                         className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm"
                      >
                         Sign Out
                      </button>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-2">API Configuration</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            This app requires a valid Google Gemini API Key with access to the <code className="bg-white/10 px-1 py-0.5 rounded">gemini-2.5-flash-preview-tts</code> model.
                        </p>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-300">Gemini API Key</label>
                            <div className="flex gap-2">
                              <input 
                                  type="password" 
                                  value={user?.apiKey || ''}
                                  onChange={(e) => updateUserProfile({ apiKey: e.target.value })}
                                  placeholder="AIzaSy..."
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors"
                              />
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Shield size={12} /> Your key is stored locally in your browser session.
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <h3 className="text-xl font-bold mb-4">App Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3">
                              <span className="text-gray-300">Dark Mode</span>
                              <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer opacity-80">
                                  <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full shadow-sm" />
                              </div>
                          </div>
                          <div className="flex items-center justify-between py-3">
                              <span className="text-gray-300">High Quality Audio (WAV)</span>
                              <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer">
                                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                              </div>
                          </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 text-center">
                        <p className="text-xs text-gray-600">
                            NeonVoice Studio v1.1.0 • Account ID: {user?.id.slice(-6)} <br/>
                            Powered by Google Gemini 2.5 Flash
                        </p>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
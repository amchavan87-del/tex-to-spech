import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const authService = new AuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await authService.login(formData.email, formData.password);
        onLogin(user);
      } else {
        if (!formData.name) throw new Error("Name is required");
        const user = await authService.signup(formData.email, formData.password, formData.name);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-black overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 animate-pulse-slow"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 via-black/50 to-black"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 mb-4 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Enter your credentials to access your studio' : 'Join NeonVoice to start synthesizing'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 ml-1 uppercase font-bold tracking-wider">Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] outline-none transition-all placeholder:text-gray-700"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1 uppercase font-bold tracking-wider">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] outline-none transition-all placeholder:text-gray-700"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1 uppercase font-bold tracking-wider">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-secondary transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-secondary/50 focus:shadow-[0_0_15px_rgba(112,0,255,0.1)] outline-none transition-all placeholder:text-gray-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="ml-2 text-primary hover:text-white transition-colors font-medium underline-offset-4 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
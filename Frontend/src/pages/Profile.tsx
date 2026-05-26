import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, Mail, Shield, Activity, Copy, Check, 
  Terminal, Server, Key, AlertTriangle 
} from 'lucide-react';
import { getMe } from '@/services/endpoints';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Profile() {
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: getMe,
    retry: 1,
  });

  const handleCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      toast.success('User ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-8">
        <div className="w-full max-w-2xl bg-surface/50 border border-border/50 rounded-xl p-8 animate-pulse">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-muted/80" />
            <div className="space-y-3">
              <div className="h-8 w-48 bg-muted/80 rounded" />
              <div className="h-4 w-32 bg-muted/80 rounded" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-16 w-full bg-muted/50 rounded-lg" />
            <div className="h-16 w-full bg-muted/50 rounded-lg" />
            <div className="h-16 w-full bg-muted/50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface/80 backdrop-blur-md border border-red-500/30 rounded-xl p-8 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 font-mono">SYSTEM_ERROR</h3>
          <p className="text-muted-foreground text-sm mb-6 font-mono">
            Failed to retrieve user profile data. Connection to identity server interrupted.
          </p>
          <p className="text-xs text-red-400 mb-6 font-mono break-words">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded transition-colors font-mono text-xs uppercase tracking-widest"
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center space-x-3 mb-8">
          <Terminal className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase font-mono">
            User <span className="text-primary">Profile</span>
          </h1>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-4" />
        </div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative group"
        >
          {/* Cyberpunk Glow Background */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-surface/90 backdrop-blur-xl border border-border/80 rounded-2xl overflow-hidden">
            {/* Top decorative bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
            
            <div className="p-8">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/30 flex items-center justify-center p-1 relative z-10 group-hover:border-primary/60 transition-colors shadow-[0_0_20px_rgba(94,234,212,0.15)]">
                    <div className="w-full h-full bg-surface rounded-xl flex items-center justify-center overflow-hidden relative">
                      <User className="w-10 h-10 text-primary/70" />
                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 shadow-[0_0_10px_rgba(94,234,212,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  </div>
                  {/* Status Indicator on Avatar */}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-background flex items-center justify-center z-20">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 border-background",
                      profile.trading_enabled ? "bg-green-500" : "bg-red-500"
                    )} />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{profile.name}</h2>
                    {profile.subscription_active && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                        PRO TIER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-muted-foreground font-mono text-sm">
                    <Mail className="w-4 h-4 mr-2 opacity-70" />
                    {profile.email}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* User ID Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-border/50 group/box hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      <Key className="w-3.5 h-3.5 mr-2" />
                      System ID
                    </div>
                    <button 
                      onClick={handleCopyId}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Copy ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white/90 break-all bg-black/60 p-2 rounded border border-border/30">
                    {profile.id}
                  </div>
                </div>

                {/* Auth Provider Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-border/50 group/box hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                    <Server className="w-3.5 h-3.5 mr-2" />
                    Identity Provider
                  </div>
                  <div className="flex items-center mt-3">
                    <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium text-sm flex items-center capitalize">
                      {profile.auth_provider === 'google' ? (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      {profile.auth_provider} Auth
                    </div>
                  </div>
                </div>

                {/* Subscription Status Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-border/50 group/box hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                    <Shield className="w-3.5 h-3.5 mr-2" />
                    Access Level
                  </div>
                  <div className="flex items-center mt-3">
                    <div className={cn(
                      "px-3 py-1 rounded text-sm font-medium border flex items-center",
                      profile.subscription_active 
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]" 
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {profile.subscription_active ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-purple-500 mr-2 shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                          Premium Active
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2" />
                          Standard Basic
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trading Engine Status Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-border/50 group/box hover:border-primary/30 transition-colors">
                  <div className="flex items-center text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                    <Activity className="w-3.5 h-3.5 mr-2" />
                    Engine Status
                  </div>
                  <div className="flex items-center mt-3">
                    <div className={cn(
                      "px-3 py-1 rounded text-sm font-medium border flex items-center",
                      profile.trading_enabled 
                        ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(94,234,212,0.15)]" 
                        : "bg-orange-500/10 text-orange-400 border-orange-500/30"
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        profile.trading_enabled ? "bg-primary animate-pulse shadow-[0_0_5px_rgba(94,234,212,0.8)]" : "bg-orange-500"
                      )} />
                      {profile.trading_enabled ? 'Trading Enabled' : 'Trading Disabled'}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Bottom Accent Line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="bg-black/40 px-8 py-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                System Online
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

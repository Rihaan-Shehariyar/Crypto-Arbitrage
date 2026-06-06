import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Activity, Copy, Check,
  Server, Key, AlertTriangle, RefreshCw
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

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <div className="bg-surface border border-border rounded-xl p-6 animate-pulse shadow-card">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-44 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
          {[1,2,3,4].map(i => <div key={i} className="h-16 w-full bg-muted rounded-xl mb-3" />)}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-surface border border-rose-200 rounded-xl p-8 text-center shadow-card"
        >
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Profile Error</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Failed to load user profile data.
          </p>
          <p className="text-xs text-rose-600 font-mono mb-5 break-words">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  /* ── Info Row Component ── */
  // const InfoRow = ({
  //   icon: Icon,
  //   label,
  //   children,
  // }: {
  //   icon: React.ElementType;
  //   label: string;
  //   children: React.ReactNode;
  // }) => (
  //   <div className="flex items-start justify-between p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
  //     <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  //       <Icon className="w-3.5 h-3.5" />
  //       {label}
  //     </div>
  //     <div className="text-right">{children}</div>
  //   </div>
  // );

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Page title */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">User Profile</h1>
        <div className="flex-1 h-px bg-border ml-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden">

          {/* ── Profile Header ── */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
                  <User className="w-9 h-9 text-muted-foreground/40" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
                  <div className={cn(
                    'w-3 h-3 rounded-full border-2 border-surface',
                    profile.trading_enabled ? 'bg-emerald-500' : 'bg-rose-500'
                  )} />
                </div>
              </div>

              {/* Name & email */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">{profile.name}</h2>
                  {profile.subscription_active && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 uppercase tracking-wider">
                      Pro
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 opacity-60" />
                  {profile.email}
                </div>
              </div>
            </div>
          </div>

          {/* ── Data Grid ── */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* System ID */}
            <div className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5" />
                  System ID
                </div>
                <button
                  onClick={handleCopyId}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Copy ID"
                >
                  {copied
                    ? <Check className="w-4 h-4 text-emerald-600" />
                    : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="font-mono text-xs text-foreground break-all bg-surface border border-border rounded-lg p-2.5">
                {profile.id}
              </div>
            </div>

            {/* Auth Provider */}
            <div className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Server className="w-3.5 h-3.5" />
                Identity Provider
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold capitalize">
                {profile.auth_provider === 'google' && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {profile.auth_provider} Auth
              </span>
            </div>

            {/* Subscription */}
            <div className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Shield className="w-3.5 h-3.5" />
                Subscription
              </div>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border',
                profile.subscription_active
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-muted text-muted-foreground border-border'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', profile.subscription_active ? 'bg-primary' : 'bg-muted-foreground')} />
                {profile.subscription_active ? 'Premium Active' : 'Standard Basic'}
              </span>
            </div>

            {/* Trading Engine */}
            <div className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors col-span-1 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Activity className="w-3.5 h-3.5" />
                Engine Status
              </div>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border',
                profile.trading_enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50   text-amber-700   border-amber-200'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  profile.trading_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                )} />
                {profile.trading_enabled ? 'Trading Enabled' : 'Trading Disabled'}
              </span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              System Online
            </div>
            <span>v1.0.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

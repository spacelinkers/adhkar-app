import { Logo } from '../components/Icons';
import { InspirationCard } from '../components/InspirationCard';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

interface Props {
  onSignIn: () => Promise<void>;
  status: 'unauthenticated' | 'pending' | 'denied' | 'error';
  email: string | null;
  error: string | null;
}

export function LoginPage({ onSignIn, status, email, error }: Props) {
  const loading = status === 'pending';

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary shadow-soft-sm">
          <Logo className="h-5 w-5 text-card" />
        </div>
        <div>
          <div className="text-[17px] font-bold text-ink">Adhkār</div>
          <div className="text-[11px] font-medium text-ink-mute">Sura Memorisation</div>
        </div>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          <InspirationCard />

          <div className="mt-5 rounded-xl border border-line-soft bg-card px-6 py-8 text-center shadow-soft-md">
            {status === 'denied' ? (
              <>
                <div className="mb-4 rounded-lg bg-rose/10 px-4 py-3 text-[13px] leading-[1.6] text-rose">
                  <strong>Access denied.</strong><br />
                  <span className="text-[12px]">{email} is not on the allowed list.</span>
                </div>
                <button
                  onClick={onSignIn}
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-card py-3 text-[13.5px] font-semibold text-ink shadow-soft-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  <GoogleIcon />
                  Try a different account
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-1 text-[18px] font-bold text-ink">Sign in to continue</h2>
                <p className="mb-6 text-[13px] text-ink-mute">
                  This app is private. Sign in with an authorised Google account.
                </p>
                <button
                  onClick={onSignIn}
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-card py-3.5 text-[13.5px] font-semibold text-ink shadow-soft-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="text-ink-mute">Signing in…</span>
                  ) : (
                    <>
                      <GoogleIcon />
                      Sign in with Google
                    </>
                  )}
                </button>
                {error && (
                  <p className="mt-3 text-[12px] text-rose">{error}</p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

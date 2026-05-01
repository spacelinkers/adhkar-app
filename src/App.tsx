import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCards } from './hooks/useCards';
import { BootScreen } from './components/BootScreen';
import { SyncStatus } from './components/SyncStatus';
import { HomePage } from './pages/HomePage';
import { DetailPage } from './pages/DetailPage';
import { SubDetailPage } from './pages/SubDetailPage';
import { isFirebaseConfigured } from './lib/firebase';

export default function App() {
  const auth = useAuth();
  const store = useCards({
    userId: auth.userId,
    enabled: auth.status === 'authed' || auth.status === 'error',
  });

  // Boot screen logic:
  // - while auth is pending and Firebase is configured, show "Signing in…"
  // - while cards are loading from Firestore, show "Loading…"
  // - when localStorage-only, show briefly then hide
  const bootStatus =
    auth.status === 'pending'
      ? 'Signing in…'
      : !store.isLoaded && auth.status === 'authed'
      ? 'Loading your duas…'
      : 'Ready';

  const bootHidden = store.isLoaded;

  return (
    <BrowserRouter>
      <BootScreen status={bootStatus} hidden={bootHidden} />
      <SyncStatus sync={store.sync} />

      {!isFirebaseConfigured && (
        <div className="mx-auto mt-3 max-w-[720px] rounded-md border border-[#f0c878] bg-[#fef3e3] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[#6e4c1d]">
          <strong>⚠ Running in offline mode.</strong> Firebase is not configured, so duas are saved only on this device. See{' '}
          <code className="rounded-sm bg-black/5 px-1 py-0.5 text-[11.5px]">README.md</code>{' '}
          to enable cloud sync.
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage store={store} />} />
        <Route path="/card/:cardId" element={<DetailPage store={store} />} />
        <Route path="/card/:cardId/dua/:subId" element={<SubDetailPage store={store} />} />
      </Routes>
    </BrowserRouter>
  );
}

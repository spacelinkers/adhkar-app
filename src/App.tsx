import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCards } from './hooks/useCards';
import { BootScreen } from './components/BootScreen';
import { SyncStatus } from './components/SyncStatus';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DetailPage } from './pages/DetailPage';
import { SubDetailPage } from './pages/SubDetailPage';
import { DuaLibraryPage } from './pages/DuaLibraryPage';
import { DuaDetailPage }  from './pages/DuaDetailPage';

export default function App() {
  const auth = useAuth();
  const store = useCards({
    userId: auth.userId,
    enabled: auth.status === 'authed',
  });

  // Show login screen for any non-authed, non-loading state
  if (auth.status === 'unauthenticated' || auth.status === 'denied' || auth.status === 'error') {
    return (
      <LoginPage
        onSignIn={auth.signIn}
        status={auth.status}
        email={auth.email}
        error={auth.error}
      />
    );
  }

  // Show boot screen while auth or data is loading
  const bootStatus =
    auth.status === 'pending'
      ? 'Signing in…'
      : !store.isLoaded
      ? 'Loading your duas…'
      : 'Ready';

  return (
    <BrowserRouter>
      <BootScreen status={bootStatus} hidden={store.isLoaded} />
      <SyncStatus sync={store.sync} />

      <Routes>
        <Route path="/"                          element={<HomePage       store={store} onSignOut={auth.signOut} displayName={auth.displayName} email={auth.email} photoURL={auth.photoURL} />} />
        <Route path="/library"                   element={<DuaLibraryPage store={store} isAdmin={auth.isAdmin} email={auth.email} />} />
        <Route path="/library/:duaId"            element={<DuaDetailPage  store={store} isAdmin={auth.isAdmin} email={auth.email} />} />
        <Route path="/card/:cardId"              element={<DetailPage     store={store} />} />
        <Route path="/card/:cardId/dua/:subId"   element={<SubDetailPage  store={store} />} />
      </Routes>
    </BrowserRouter>
  );
}

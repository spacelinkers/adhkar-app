import { useState } from 'react';
import { BrandBar } from '../components/BrandBar';
import { CollectionCard } from '../components/CollectionCard';
import { StatCard, RingStat } from '../components/StatCard';
import { CardModal } from '../components/CardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus } from '../components/Icons';
import type { Card } from '../types';
import type { UseCardsResult } from '../hooks/useCards';

interface Props {
  store: UseCardsResult;
}

function formatRelative(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function HomePage({ store }: Props) {
  const { cards, sync: _sync, cloudEnabled, createCard, updateCard, deleteCard, clearLocal } = store;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [confirmCard, setConfirmCard] = useState<Card | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const totalSubs = cards.reduce((n, c) => n + (c.subcards?.length || 0), 0);
  const lastUpdated = cards.reduce<Card | null>(
    (best, c) => (c.updatedAt > (best?.updatedAt || 0) ? c : best),
    null,
  );

  const openNew = () => { setEditingCard(null); setModalOpen(true); };
  const openEdit = (card: Card) => { setEditingCard(card); setModalOpen(true); };

  const handleSave = async (title: string, desc: string) => {
    if (editingCard) {
      await updateCard(editingCard.id, { title, desc });
    } else {
      await createCard(title, desc);
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmCard) {
      await deleteCard(confirmCard.id);
      setConfirmCard(null);
    }
  };

  return (
    <>
      <BrandBar />

      <main className="mx-auto max-w-[720px] px-4 pb-32">
        {/* Hero */}
        <div className="relative mb-[18px] mt-2 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-deep p-6 text-card shadow-soft-md">
          <div
            className="pointer-events-none absolute -bottom-10 -right-10 h-[200px] w-[200px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
          />
          <div className="mb-3.5 text-right font-arabic text-[28px] leading-[1.5]" dir="rtl">
            السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
          </div>
          <p className="mb-4 max-w-[88%] text-sm leading-[1.55] text-white/90">
            Your personal collection of duas and remembrances. Save, organise, and revisit the words you cherish.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={openNew}
              className="cursor-pointer rounded-full border-0 bg-gold px-[22px] py-[11px] text-sm font-semibold text-ink transition-transform active:scale-95"
              style={{ boxShadow: '0 2px 6px rgba(184,137,58,0.3)' }}
            >
              + New Collection
            </button>
            <button
              onClick={() => document.querySelector('.section-label')?.scrollIntoView({ behavior: 'smooth' })}
              className="cursor-pointer rounded-full border-[1.5px] border-white/40 bg-transparent px-[22px] py-[11px] text-sm font-semibold text-card active:bg-white/10"
            >
              Browse
            </button>
          </div>
        </div>

        {/* Stat grid */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <RingStat
            count={cards.length}
            label="Collections"
            sub={cards.length === 1 ? '1 created' : `${cards.length} created`}
          />
          <StatCard
            label="Total Duas"
            value={
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[22px]">📿</span>
                <span>{totalSubs}</span>
              </div>
            }
            sub={
              totalSubs === 1
                ? 'across 1 collection'
                : `across ${cards.length} collection${cards.length === 1 ? '' : 's'}`
            }
          />
          <StatCard
            label="Last Added"
            value={lastUpdated?.title || '—'}
            sub={lastUpdated ? formatRelative(lastUpdated.updatedAt) : 'no entries yet'}
            valueClass="text-lg font-bold"
          />
          <StatCard
            label="Sync"
            value={cloudEnabled ? 'Cloud' : 'Local'}
            sub={cloudEnabled ? 'synced & private' : 'device only'}
            valueClass="text-base font-bold"
          />
        </div>

        {/* Collections */}
        <div className="section-label">Your Collections</div>
        {cards.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-line bg-card px-5 py-9 text-center">
            <div className="mb-2.5 font-arabic text-[26px] text-primary" dir="rtl">ٱبْدَأْ</div>
            <h2 className="mb-1.5 text-[17px] font-bold">Begin Your Collection</h2>
            <p className="m-0 text-[13px] leading-[1.6] text-ink-mute">
              Tap "+ New Collection" above to add your first<br />set of duas and remembrances.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cards.map((c) => (
              <CollectionCard
                key={c.id}
                card={c}
                onEdit={openEdit}
                onDelete={(card) => setConfirmCard(card)}
              />
            ))}
          </div>
        )}

        {/* Credits */}
        <div className="section-label">Credits</div>
        <div className="mb-2.5 rounded-md border border-line-soft bg-card px-4 py-3.5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-ink-mute">Inspiration</div>
          <div className="m-0 mb-1 text-sm font-bold text-ink">Hisnul Muslim — Fortress of the Muslim</div>
          <div className="m-0 mb-1.5 text-[12.5px] italic text-ink-soft">by Sa'id ibn Ali ibn Wahf al-Qahtani</div>
          <p className="m-0 text-[12.5px] leading-[1.55] text-ink-soft">
            A classical compilation of authentic duas and remembrances from the Qur'an and Sunnah.
          </p>
        </div>
        <div className="mb-2.5 rounded-md border border-line-soft bg-card px-4 py-3.5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-ink-mute">App</div>
          <div className="m-0 mb-1 text-sm font-bold text-ink">Adhkār Personal Collection</div>
          <p className="m-0 text-[12.5px] leading-[1.55] text-ink-soft">
            A space to save the duas you encounter, with their meanings and rewards, in your own organised way.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-[18px] rounded-md border border-dashed border-line bg-card-soft p-4">
          <p className="m-0 mb-2.5 text-xs leading-[1.65] text-ink-mute">
            {cloudEnabled
              ? "Your duas sync privately to your account. They're only visible to you. Clearing site data here will keep them in the cloud."
              : 'Your duas are saved only on this device. Cloud sync requires Firebase configuration — see SETUP.md. Clearing site data here will erase everything saved locally.'}
          </p>
          <button
            onClick={() => setConfirmClear(true)}
            className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-rose underline underline-offset-2"
          >
            Clear all data
          </button>
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={openNew}
        aria-label="Add collection"
        className="fixed bottom-[22px] right-1/2 z-40 grid h-14 w-14 cursor-pointer place-items-center rounded-2xl border-0 bg-primary text-card transition-transform active:scale-90"
        style={{
          transform: 'translateX(min(338px, 50vw))',
          boxShadow: '0 8px 24px rgba(15,61,46,.35), 0 2px 6px rgba(15,61,46,.2)',
        }}
      >
        <Plus className="h-[22px] w-[22px]" />
      </button>

      <CardModal
        open={modalOpen}
        card={editingCard}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmCard}
        title="Delete collection?"
        message={
          confirmCard
            ? `"${confirmCard.title}" and all ${confirmCard.subcards?.length || 0} dua${
                (confirmCard.subcards?.length || 0) === 1 ? '' : 's'
              } inside will be removed.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmCard(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear all local data?"
        message={
          cloudEnabled
            ? 'This clears the local cache. Your duas will reload from the cloud on next sync.'
            : 'This will permanently erase all your duas saved on this device.'
        }
        confirmLabel="Clear"
        onConfirm={() => { clearLocal(); setConfirmClear(false); }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}

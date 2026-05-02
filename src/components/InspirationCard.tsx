interface Props {
  arabic?: string;
  title?: string;
  subtitle?: string;
}

export function InspirationCard({
  arabic = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  title = 'Begin with the name of Allah',
  subtitle = 'The Most Gracious, the Most Merciful',
}: Props) {
  return (
    <div className="mx-4 mt-3 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-deep px-5 py-7 text-center shadow-soft-md">
      <div className="mb-1.5 inline-block rounded-full bg-gold px-3 py-0.5 text-[9px] font-bold uppercase tracking-[2px] text-ink">
        بسم الله
      </div>
      <div
        className="my-3 font-arabic text-[26px] leading-[1.95] text-card"
        dir="rtl"
      >
        {arabic}
      </div>
      <p className="mb-0.5 text-[13.5px] font-semibold text-card">{title}</p>
      <p className="m-0 text-[12px] leading-[1.55] text-card/65">{subtitle}</p>
    </div>
  );
}

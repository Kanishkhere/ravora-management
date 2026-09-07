import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  priority?: boolean;
  className?: string;
};

export function BrandMark({
  compact = false,
  priority = false,
  className = "",
}: BrandMarkProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`.trim()}>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-gold/40 bg-paper shadow-sm sm:size-11">
        <Image
          src="/images/ravora-logo-mark.png"
          alt=""
          width={44}
          height={44}
          priority={priority}
          className="size-full object-contain"
          sizes="44px"
        />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold leading-none tracking-[0.08em] text-charcoal sm:text-2xl">
            RAVORA
          </p>
          <p className="mt-1 truncate text-[0.58rem] font-bold uppercase tracking-[0.3em] text-gold-deep">
            Beauty Studio and Academy
          </p>
        </div>
      )}
    </div>
  );
}

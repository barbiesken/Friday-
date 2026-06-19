'use client';

import { motion, type Variants } from 'framer-motion';
import { useStore } from '@/lib/store';
import { SECTIONS, SPECS, type SectionDef } from '@/lib/constants';

const ease = [0.16, 1, 0.3, 1] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease } },
};
const fromLeft: Variants = {
  hidden: { opacity: 0, x: -40, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease } },
};
const fromRight: Variants = {
  hidden: { opacity: 0, x: 40, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.08 } },
};

function GhostNumber({ n }: { n: number }) {
  return (
    <span className="pointer-events-none absolute -top-16 select-none font-display text-[10rem] leading-none text-white/[0.03] md:text-[16rem]">
      {String(n).padStart(2, '0')}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <motion.p variants={reveal} className="mb-5 font-sans text-[11px] uppercase tracking-luxe text-ice">
      {children}
    </motion.p>
  );
}
function Title({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2 variants={reveal} className="font-display text-4xl font-light leading-[1.05] text-platinum-bright md:text-6xl">
      {children}
    </motion.h2>
  );
}
function Body({ children }: { children: React.ReactNode }) {
  return (
    <motion.p variants={reveal} className="mt-6 max-w-md font-sans text-base leading-relaxed text-platinum-soft">
      {children}
    </motion.p>
  );
}

function ChapterPanel({ s, align }: { s: SectionDef; align: 'left' | 'right' }) {
  const justify = align === 'right' ? 'items-end text-right' : 'items-start text-left';
  return (
    <section id={s.id} className={`relative flex h-screen w-full flex-col justify-center px-8 md:px-20 ${justify}`}>
      <motion.div
        variants={align === 'right' ? fromRight : fromLeft}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
        className="relative max-w-xl"
      >
        <GhostNumber n={s.index} />
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.5 }}>
          <Kicker>{s.kicker}</Kicker>
          <Title>{s.title}</Title>
          {s.body && <Body>{s.body}</Body>}
        </motion.div>
      </motion.div>
    </section>
  );
}

function OpenSection() {
  const entered = useStore((st) => st.entered);
  const s = SECTIONS[0];
  return (
    <section id={s.id} className="relative flex h-screen w-full flex-col items-center justify-center text-center">
      <motion.div initial="hidden" animate={entered ? 'show' : 'hidden'} variants={stagger} className="flex flex-col items-center">
        <motion.p variants={reveal} className="font-display text-5xl tracking-wide2 text-platinum-bright md:text-7xl">
          {s.kicker.toUpperCase()}
        </motion.p>
        <motion.h1 variants={reveal} className="mt-4 font-display text-3xl font-light tracking-wide2 text-ice-bright md:text-5xl">
          {s.title}
        </motion.h1>
        <motion.p variants={reveal} className="mt-8 font-sans text-[11px] uppercase tracking-luxe text-platinum-dim">
          {s.body}
        </motion.p>
      </motion.div>
    </section>
  );
}

function CalibreSection() {
  const s = SECTIONS[9];
  const points = ['Chronergy escapement', 'Paramagnetic hairspring', '14 patents', '70-hour reserve'];
  return (
    <section id={s.id} className="relative flex h-screen w-full flex-col justify-center px-8 md:px-20">
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.5 }} className="relative max-w-xl">
        <GhostNumber n={s.index} />
        <Kicker>{s.kicker}</Kicker>
        <Title>{s.title}</Title>
        {s.body && <Body>{s.body}</Body>}
        <motion.ul variants={reveal} className="mt-8 grid grid-cols-2 gap-3">
          {points.map((p) => (
            <li key={p} className="border-l border-ice/40 pl-3 font-sans text-[12px] uppercase tracking-wide2 text-platinum-soft">
              {p}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}

function FinaleSection() {
  const s = SECTIONS[14];
  return (
    <section id={s.id} className="relative flex min-h-screen w-full flex-col items-center justify-center px-8 text-center">
      <motion.div initial="hidden" whileInView="show" viewport={{ amount: 0.5 }} variants={stagger}>
        <Kicker>{s.kicker}</Kicker>
        <motion.h2 variants={reveal} className="font-display text-5xl font-light uppercase tracking-wide2 text-platinum-bright md:text-7xl">
          {s.title}
        </motion.h2>
        {s.body && <Body>{s.body}</Body>}
      </motion.div>

      <motion.dl
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.3 }}
        variants={stagger}
        className="mt-16 grid w-full max-w-2xl grid-cols-2 gap-x-10 gap-y-3 text-left"
      >
        {SPECS.map((sp) => (
          <motion.div key={sp.k} variants={reveal} className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <dt className="font-sans text-[11px] uppercase tracking-wide2 text-platinum-dim">{sp.k}</dt>
            <dd className="font-sans text-sm text-platinum-soft">{sp.v}</dd>
          </motion.div>
        ))}
      </motion.dl>

      <p className="mt-16 max-w-lg font-sans text-[10px] leading-relaxed tracking-wide2 text-platinum-dim/70">
        An unofficial concept experience created as a design study. Not affiliated with, endorsed by, or sponsored by
        Rolex SA. All trademarks belong to their respective owners.
      </p>
    </section>
  );
}

export default function Sections({ onSeek }: { onSeek: (i: number) => void }) {
  void onSeek;
  return (
    <main className="relative z-10">
      {SECTIONS.map((s) => {
        if (s.index === 0) return <OpenSection key={s.id} />;
        if (s.index === 9) return <CalibreSection key={s.id} />;
        if (s.index === 14) return <FinaleSection key={s.id} />;
        return <ChapterPanel key={s.id} s={s} align={s.index % 2 === 0 ? 'left' : 'right'} />;
      })}
    </main>
  );
}

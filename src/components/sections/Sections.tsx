'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { SECTIONS, SPECS } from '@/lib/constants';

const reveal = {
  hidden: { opacity: 0, y: 26, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};

function Panel({
  id,
  align = 'left',
  children,
}: {
  id: string;
  align?: 'left' | 'right' | 'center';
  children: React.ReactNode;
}) {
  const justify = align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left';
  return (
    <section
      id={id}
      className={`relative flex h-screen w-full flex-col justify-center px-8 md:px-20 ${justify}`}
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
        className="max-w-xl"
      >
        {children}
      </motion.div>
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      variants={reveal}
      className="mb-5 font-sans text-[11px] uppercase tracking-luxe text-ice"
    >
      {children}
    </motion.p>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      variants={reveal}
      className="font-display text-4xl font-light leading-[1.05] text-platinum-bright md:text-6xl"
    >
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

function OpenSection() {
  const entered = useStore((s) => s.entered);
  const s = SECTIONS[0];
  return (
    <section id={s.id} className="relative flex h-screen w-full flex-col items-center justify-center text-center">
      <motion.div
        initial="hidden"
        animate={entered ? 'show' : 'hidden'}
        variants={stagger}
        className="flex flex-col items-center"
      >
        <motion.p variants={reveal} className="font-display text-5xl tracking-wide2 text-platinum-bright md:text-7xl">
          {s.kicker.toUpperCase()}
        </motion.p>
        <motion.h1
          variants={reveal}
          className="mt-4 font-display text-3xl font-light tracking-wide2 text-ice-bright md:text-5xl"
        >
          {s.title}
        </motion.h1>
        <motion.p
          variants={reveal}
          className="mt-8 font-sans text-[11px] uppercase tracking-luxe text-platinum-dim"
        >
          {s.body}
        </motion.p>
      </motion.div>
    </section>
  );
}

function CalibreSection() {
  const s = SECTIONS[4];
  const points = ['Chronergy escapement', 'Paramagnetic hairspring', 'Perpetual rotor', '70-hour reserve'];
  return (
    <Panel id={s.id} align="left">
      <Kicker>{s.kicker}</Kicker>
      <Title>{s.title}</Title>
      <Body>{s.body}</Body>
      <motion.ul variants={reveal} className="mt-8 grid grid-cols-2 gap-3">
        {points.map((p) => (
          <li
            key={p}
            className="border-l border-ice/40 pl-3 font-sans text-[12px] uppercase tracking-wide2 text-platinum-soft"
          >
            {p}
          </li>
        ))}
      </motion.ul>
    </Panel>
  );
}

function TimeSection() {
  const s = SECTIONS[7];
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const date = now.getDate();
  return (
    <Panel id={s.id} align="center">
      <Kicker>{s.kicker}</Kicker>
      <motion.div variants={reveal} className="flex items-end justify-center gap-6">
        <span className="font-display text-5xl font-light text-platinum-bright md:text-7xl">{day}</span>
        <span className="font-display text-5xl font-light text-ice-bright md:text-7xl">{date}</span>
      </motion.div>
      <Body>{s.body}</Body>
    </Panel>
  );
}

function FinaleSection() {
  const s = SECTIONS[8];
  return (
    <section id={s.id} className="relative flex min-h-screen w-full flex-col items-center justify-center px-8 text-center">
      <motion.div initial="hidden" whileInView="show" viewport={{ amount: 0.5 }} variants={stagger}>
        <Kicker>{s.kicker}</Kicker>
        <motion.h2
          variants={reveal}
          className="font-display text-5xl font-light uppercase tracking-wide2 text-platinum-bright md:text-7xl"
        >
          {s.title}
        </motion.h2>
        <Body>{s.body}</Body>
      </motion.div>

      <motion.dl
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.3 }}
        variants={stagger}
        className="mt-16 grid w-full max-w-2xl grid-cols-2 gap-x-10 gap-y-3 text-left md:grid-cols-2"
      >
        {SPECS.map((sp) => (
          <motion.div
            key={sp.k}
            variants={reveal}
            className="flex items-baseline justify-between border-b border-white/10 pb-2"
          >
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
      <OpenSection />

      <Panel id={SECTIONS[1].id} align="left">
        <Kicker>{SECTIONS[1].kicker}</Kicker>
        <Title>{SECTIONS[1].title}</Title>
        <Body>{SECTIONS[1].body}</Body>
      </Panel>

      <Panel id={SECTIONS[2].id} align="right">
        <Kicker>{SECTIONS[2].kicker}</Kicker>
        <Title>
          <span className="text-ice-bright">Reserved</span> for Platinum.
        </Title>
        <Body>{SECTIONS[2].body}</Body>
      </Panel>

      <Panel id={SECTIONS[3].id} align="left">
        <Kicker>{SECTIONS[3].kicker}</Kicker>
        <Title>{SECTIONS[3].title}</Title>
        <Body>{SECTIONS[3].body}</Body>
      </Panel>

      <CalibreSection />

      <Panel id={SECTIONS[5].id} align="right">
        <Kicker>{SECTIONS[5].kicker}</Kicker>
        <Title>{SECTIONS[5].title}</Title>
        <Body>{SECTIONS[5].body}</Body>
      </Panel>

      <Panel id={SECTIONS[6].id} align="left">
        <Kicker>{SECTIONS[6].kicker}</Kicker>
        <Title>{SECTIONS[6].title}</Title>
        <Body>{SECTIONS[6].body}</Body>
      </Panel>

      <TimeSection />
      <FinaleSection />
    </main>
  );
}

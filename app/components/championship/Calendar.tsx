

"use client";

interface CupCardProps {
  cup: Cup;
}

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import { Trophy, Zap, Award, } from 'lucide-react';
import { motion } from 'motion/react';
import mainLogo from './logoKF.png';
import rbLogo from "@/assets/sponsors/rbLogo.svg";
import Glogo from "@/assets/sponsors/2gLogo.png";
import swsLogo from "@/assets/sponsors/swsLogoWhite.png";


interface Stage {
  date: string;
  label: string;
  format?: string;
}

interface Cup {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  borderColor: string;
  textColor: string;
  colorVar: string;
  colorVarAlpha?: string;
  format: string;
  prize: string;
  stages: Stage[];
  isSprint?: boolean;
}

const CALENDAR_DATA: Cup[] = [
  {
    id: 'spring-rookie',
    title: 'SWS Sprint Cup\nLeague Rookie&Pro Season 1',
    tag: 'Rookie + Pro',
    tagColor: 'bg-racing-spring/15 text-racing-spring',
    borderColor: 'before:bg-racing-spring',
    textColor: 'text-racing-spring',
    colorVar: 'var(--color-racing-spring)',
    colorVarAlpha: 'var(--color-racing-spring-10)',
    format: 'Класичні та нові спринти',
    prize: 'Сертифікат до 2G академії 28.06 або 23.08 для топ-3 пілотів\nАбонемент до академії картингу KartFreedom на 8 занять для переможця',
    stages: [
      { date: '05.04', label: 'Етап 1', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
      { date: '19.04', label: 'Етап 2', format: '2 спринти нового формату, розподіл по групам, кваліфікація та 20хв спринт' },
      { date: '03.05', label: 'Етап 3', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
    ],
  },
  {
    id: 'sprint-1',
    title: 'SWS Sprint Cup\nLeague Pro Season 1',
    tag: 'Sprint Pro',
    tagColor: 'bg-racing-sprint1/15 text-racing-sprint1',
    borderColor: 'before:bg-racing-sprint1',
    textColor: 'text-racing-sprint1',
    colorVar: 'var(--color-racing-sprint1)',
    colorVarAlpha: 'var(--color-racing-sprint1-10)',
    format: '1 гонка · 120 хвилин',
    prize: 'Фінансування участі у 7г гонці на треку 2G для топ-3 пілотів чемпіонату\nФінансування включає трансфер, проживання та участь у гонці.',
    isSprint: true,
    stages: [
      { date: '26.04', label: 'Етап 1', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
      { date: '10.05', label: 'Етап 2', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
      { date: '31.05', label: 'Етап 3', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
      { date: '28.06', label: 'Етап 4', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
    ],
  },
  {
    id: 'summer-rookie-1',
    title: 'SWS Sprint Cup\nLeague Rookie&Pro Season 2',
    tag: 'Rookie + Pro',
    tagColor: 'bg-racing-summer1/15 text-racing-summer1',
    borderColor: 'before:bg-racing-summer1',
    textColor: 'text-racing-summer1',
    colorVar: 'var(--color-racing-summer1)',
    colorVarAlpha: 'var(--color-racing-summer1-10)',
    format: 'Класичні та нові спринти',
    prize: 'Сертифікат до 2G академії 28.06 для топ-3 пілотів\nАбонемент до академії картингу KartFreedom на 8 занять для переможця',
    stages: [
      { date: '24.05', label: 'Етап 1', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
      { date: '07.06', label: 'Етап 2', format: '2 спринти нового формату, розподіл по групам, кваліфікація та 20хв спринт' },
      { date: '21.06', label: 'Етап 3', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
    ],
  },
  {
    id: 'summer-rookie-2',
    title: 'SWS Sprint Cup\nLeague Rookie&Pro Season 3',
    tag: 'Rookie + Pro',
    tagColor: 'bg-racing-summer2/15 text-racing-summer2',
    borderColor: 'before:bg-racing-summer2',
    textColor: 'text-racing-summer2',
    colorVar: 'var(--color-racing-summer2)',
    colorVarAlpha: 'var(--color-racing-summer2-10)',
    format: 'Класичні та нові спринти',
    prize: 'Сертифікат до 2G академії 23.08 для топ-3 пілотів\nАбонемент до академії картингу KartFreedom на 8 занять для переможця',
    stages: [
      { date: '12.07', label: 'Етап 1', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
      { date: '26.07', label: 'Етап 2', format: '2 спринти нового формату, розподіл по групам, кваліфікація та 20хв спринт' },
      { date: '09.08', label: 'Етап 3', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
    ],
  },
  {
    id: 'sprint-2',
    title: 'SWS Sprint Cup\nLeague Pro Season 2',
    tag: 'Sprint Pro',
    tagColor: 'bg-racing-sprint2/15 text-racing-sprint2',
    borderColor: 'before:bg-racing-sprint2',
    textColor: 'text-racing-sprint2',
    colorVar: 'var(--color-racing-sprint2)',
    colorVarAlpha: 'var(--color-racing-sprint2-10)',
    format: '1 гонка · 120 хвилин',
    prize: 'Фінансування участі у 7г гонці на треку 2G для топ-3 пілотів чемпіонату\nФінансування включає трансфер, проживання та участь у гонці.',
    isSprint: true,
    stages: [
      { date: '19.07', label: 'Етап 1', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
      { date: '02.08', label: 'Етап 2', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
      { date: '30.08', label: 'Етап 3', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
      { date: '20.09', label: 'Етап 4', format: 'Кваліфікація → Гонка 120 хв → Нагородження' },
    ],
  },
  {
    id: 'autumn-rookie',
    title: 'SWS Sprint Cup\nLeague Rookie&Pro Season 4',
    tag: 'Rookie + Pro',
    tagColor: 'bg-racing-autumn/15 text-racing-autumn',
    borderColor: 'before:bg-racing-autumn',
    textColor: 'text-racing-autumn',
    colorVar: 'var(--color-racing-autumn)',
    colorVarAlpha: 'var(--color-racing-autumn-10)',
    format: 'Класичні та нові спринти',
    prize: 'Абонемент до академії картингу KartFreedom на 8 занять для переможця',
    stages: [
      { date: '23.08', label: 'Етап 1', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
      { date: '06.09', label: 'Етап 2', format: '2 спринти нового формату, розподіл по групам, кваліфікація та 20хв спринт' },
      { date: '27.09', label: 'Етап 3', format: '2 класичні спринти KartFreedom, 3 відбіркових + фінал' },
      { date: '08.11', label: 'Етап 4' },
      { date: '22.11', label: 'Етап 5' },
    ],
  },
  {
    id: 'endurance-cup',
    title: 'Endurance Cup',
    tag: 'Endurance',
    tagColor: 'bg-racing-endurance/15 text-racing-endurance',
    borderColor: 'before:bg-racing-endurance',
    textColor: 'text-racing-endurance',
    colorVar: 'var(--color-racing-endurance)',
    colorVarAlpha: 'var(--color-racing-endurance-10)',
    format: '3 етапи · 4-годинна командна гонка',
    prize: '',
    stages: [
      { date: '13.09', label: 'Етап 1', format: 'Кваліфікація → Гонка 240 хв → Нагородження' },
      { date: '25.10', label: 'Етап 2', format: 'Кваліфікація → Гонка 240 хв → Нагородження' },
      { date: '29.11', label: 'Етап 3', format: 'Кваліфікація → Гонка 240 хв → Нагородження' },
    ],
  },
];


// Season start: year, monthIndex (0-based), day, hour, minute
// Set to 05.04.2026 10:00 local time
const SEASON_START = new Date(2026, 3, 5, 10, 0, 0); // April 5, 10:00

const Countdown = () => {
  const [parts, setParts] = useState<{ days?: number; hrs?: number; mins?: number; secs?: number; started?: boolean; }>({});

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = SEASON_START.getTime() - now.getTime();
      if (diff <= 0) {
        setParts({ started: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setParts({ days, hrs, mins, secs });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = (n?: number) => (n == null ? '--' : String(n).padStart(2, '0'));

  if (parts.started) {
    return (
      <div className="inline-flex items-center gap-3 px-2 py-1">
        <div className="text-white font-bold">Сезон розпочато!</div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 px-2 py-1">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-4xl font-black text-white leading-none font-mono w-12 sm:w-16 text-center">{fmt(parts.days)}</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">дн</div>
        </div>

        <div className="w-4 text-2xl sm:text-4xl text-zinc-500 font-black flex items-center justify-center leading-none -translate-y-2 sm:-translate-y-3">:</div>

        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-4xl font-black text-white leading-none font-mono w-12 sm:w-16 text-center">{fmt(parts.hrs)}</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">год</div>
        </div>

        <div className="w-4 text-2xl sm:text-4xl text-zinc-500 font-black flex items-center justify-center leading-none -translate-y-2 sm:-translate-y-3">:</div>

        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-4xl font-black text-white leading-none font-mono w-12 sm:w-16 text-center">{fmt(parts.mins)}</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">хв</div>
        </div>

        <div className="w-4 text-2xl sm:text-4xl text-zinc-500 font-black flex items-center justify-center leading-none -translate-y-2 sm:-translate-y-3">:</div>

        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-4xl font-black text-white leading-none font-mono w-12 sm:w-16 text-center">{fmt(parts.secs)}</div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">сек</div>
        </div>
      </div>
    </div>
  );
};
const CupCard: React.FC<CupCardProps & { isDownloading?: boolean; }> = ({ cup, isDownloading }) => {
  return (
    <motion.div
      initial={isDownloading ? false : { opacity: 0, y: 10 }}
      animate={isDownloading ? { opacity: 1, y: 0, transition: { duration: 0 } } : { opacity: 1, y: 0 }}
      className={`bg-racing-card border border-white/6 rounded-xl p-4 relative overflow-hidden flex flex-col h-full before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:rounded-t-lg ${cup.borderColor}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-3 rounded-t-xl"
        style={{ background: (cup.colorVar as any), boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)' }}
      />
      <div className="flex justify-between items-start mb-1 relative z-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[9px] sm:text-[11px] font-black tracking-[0.15em] uppercase"
          style={{ background: (cup.colorVarAlpha as any), color: (cup.colorVar as any) }}
        >
          {cup.tag === 'Sprint Pro' ? <Zap size={12} /> : <Trophy size={12} />}
          {cup.tag}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-[9px] font-bold text-white/60 tracking-widest uppercase">
            {cup.id === 'endurance-cup' ? 'Endurance Marathon' : cup.isSprint ? 'Long Distance' : 'Classic + New Format'}
          </div>
        </div>
      </div>

      <h3 className="font-display text-sm sm:text-2xl font-black uppercase tracking-tight leading-none mb-1 relative z-10">
        <span className="whitespace-pre-line">{cup.title}</span>
      </h3>

      <div className="flex-grow flex flex-col relative z-10">
        <div className={`space-y-1 ${cup.id === 'endurance' ? 'mb-0 min-h-0' : 'mb-0 min-h-[140px]'}`}>
          <div className="text-[9px] sm:text-[11px] font-bold text-white/60 uppercase tracking-widest">Формат</div>
          <div className="text-[11px] sm:text-[12px] text-racing-muted leading-tight flex items-start gap-1.5">
            <div className="flex-1 space-y-1">
              {cup.stages.some(s => s.format) ? (
                cup.stages.map((s: Stage, i: number) => s.format ? (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-white/30 shrink-0 font-black text-[9px] mt-0.5 uppercase w-8">{s.label}</span>
                    <span className="leading-tight">{s.format}</span>
                  </div>
                ) : null)
              ) : (
                <span className="whitespace-pre-line">{cup.format}</span>
              )}
            </div>
          </div>
        </div>


        <div className={`${cup.id === 'endurance' ? '' : 'flex-grow flex flex-col'}`}>
          <div className={`space-y-0.5 border-t border-white/5 mb-5 ${cup.id === 'endurance' ? 'pt-0.5' : 'pt-0.5'}`}>
            {cup.tag !== 'Endurance' && (
              <>
                <div className="text-[9px] sm:text-[11px] font-bold text-white/60 uppercase tracking-widest">
                  {cup.tag === 'Sprint Pro' || cup.tag === 'Endurance' ? 'Нагорода' : 'Нагорода для заліку Rookie'}
                </div>
                <div className="text-[11px] sm:text-[12px] text-racing-muted leading-tight flex items-start gap-1.5 min-h-[18px]">
                  <Award size={10} className="opacity-40 shrink-0 mt-0.5" />
                  <span className="flex-1 whitespace-pre-line">{cup.prize}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto flex flex-wrap gap-1 pl-[5px]">
            {cup.stages.map((stage: Stage, idx: number) => (
              <div
                key={idx}
                className={`bg-white/5 border border-white/5 rounded py-3 sm:py-4 px-4 sm:px-6 flex flex-col justify-start items-center text-center flex-1 min-w-[30px] relative group transition-all hover:border-white/60 hover:bg-white/10`}
              >
                <span className="block text-[8px] font-bold tracking-widest uppercase text-white/60 mb-0.5 mt-1">{stage.label}</span>
                <span style={{ color: (cup.colorVar as any) }} className={`font-display text-base sm:text-xl font-bold tracking-wider leading-none`}>{stage.date}</span>

                {idx === cup.stages.length - 1 && (
                  <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-[#ff3a2b] rounded-full shadow-[0_0_6px_rgba(255,58,43,0.5)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Calendar: React.FC = () => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isDownloading] = useState(false);

  // Export function removed — keep `isDownloading` for potential future use

  return (
    <div className="min-h-screen bg-racing-bg grid-texture text-racing-text font-sans selection:bg-red-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div id="calendar-capture" ref={calendarRef} className="bg-racing-bg grid-texture p-6">
          {/* Header */}
          <header className="text-center mb-1 relative">
            <div className="inline-flex items-center gap-3 font-display text-[10px] tracking-[0.4em] text-racing-muted uppercase mb-0.5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#ff3a2b]" />
              Офіційний календар
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#ff3a2b]" />
            </div>
            <div className="flex justify-center mb-2 h-10 sm:h-14">
              <Image src={(mainLogo as any).src ?? mainLogo} alt="KartFreedom Logo" width={160} height={48} className="h-full w-auto object-contain" />
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="font-display text-base sm:text-2xl font-bold tracking-[0.2em] uppercase text-white -mt-1 opacity-80">
                Race League 2026
              </div>
              {/* {!isExporting && (
                <button
                  onClick={downloadCalendar}
                  disabled={isExporting}
                  className="ml-2 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/6 hover:bg-white/8 text-sm font-semibold"
                  title="Завантажити календар як зображення"
                >
                  {isExporting ? 'Експорт...' : 'Завантажити'}
                </button>
              )} */}
            </div>
            <div className="mt-3 flex items-center justify-center">
              <Countdown />
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mt-2">

              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex flex-col items-center">
                <div className="text-[12px] sm:text-[14px] font-black text-white leading-none">39</div>
                <div className="text-[8px] font-bold text-racing-muted uppercase tracking-widest mt-1">Гонок</div>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex flex-col items-center">
                <div className="text-[12px] sm:text-[14px] font-black text-white leading-none">25</div>
                <div className="text-[8px] font-bold text-racing-muted uppercase tracking-widest mt-1">Етапів</div>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex flex-col items-center">
                <div className="text-[12px] sm:text-[14px] font-black text-white leading-none">7</div>
                <div className="text-[8px] font-bold text-racing-muted uppercase tracking-widest mt-1">Чемпіонатів</div>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex flex-col items-center">
                <div className="text-[12px] sm:text-[14px] font-black text-[#ff3a2b] leading-none">05.04</div>
                <div className="text-[8px] font-bold text-[#ff3a2b] uppercase tracking-widest mt-1">Старт</div>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />

              <Image src={(rbLogo as any).src ?? rbLogo} alt="Red Bull Logo" width={48} height={48} className="h-8 sm:h-12 w-auto object-contain opacity-100" />
              <Image src={(Glogo as any).src ?? Glogo} alt="2G Logo" width={40} height={28} className="h-6 sm:h-7 w-auto object-contain opacity-100" />
              <Image
                src={(swsLogo as any).src ?? swsLogo}
                alt="SWS Logo"
                width={80}
                height={56}
                quality={100}
                unoptimized
                className="h-6 sm:h-7 w-auto object-contain opacity-100"
              />


            </div>

            {/* Main Prize Section */}
            <div className="mt-2 mb-4">
              <div className="bg-racing-card border border-racing-sprint1/30 rounded-xl p-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-racing-sprint1/10 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-racing-sprint1/20 transition-colors" />
                <div className="relative z-10 text-center">
                  <h4 className="font-display text-[12px] font-bold text-[#ff3a2b] uppercase tracking-widest mb-0.5">Головна нагорода сезону</h4>
                  <p className="text-[12px] leading-tight text-racing-muted font-medium italic">
                    Чемпіон KartFreedom 2026 у категорії SWS Sprint Cup представить клуб на міжнародній арені в <span className="text-white font-bold">SODI INTERNATIONAL FINALS 2027*</span> з повним фінансуванням.
                    <br />
                    Фінансування включає трансфер, проживання та участь у SODI INTERNATIONAL FINALS.
                    <br />
                    <span className="text-[9px] text-racing-muted">*При умові отримання квоти до участі у SODI INTERNATIONAL FINALS.</span>
                  </p>
                </div>
              </div>
            </div>
          </header>



          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 items-stretch">
            {/* Sprint Cups (First 6) */}
            {CALENDAR_DATA.slice(0, 6).map((cup) => (
              <CupCard key={cup.id} cup={cup} isDownloading={isDownloading} />
            ))}
          </div>

          {/* Endurance Cup (Single Row) */}
          <div className="mb-2">
            <CupCard cup={CALENDAR_DATA[6]} isDownloading={isDownloading} />
          </div>

          {/* Footer */}
          <footer className="mt-2 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/10">
              © 2026 KartFreedom Racing Championship
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

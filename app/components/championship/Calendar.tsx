/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { Trophy, Flag, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef } from 'react';

interface RaceStage {
  date: string;
  label: string;
}

interface Cup {
  id: string;
  title: string;
  stages: RaceStage[];
  prize: string;
  color: string;
}

const CALENDAR_DATA: Cup[] = [
  {
    id: 'spring-rookie',
    title: 'Spring Cup Rookie + Pro 2026',
    color: 'from-emerald-500 to-teal-600',
    stages: [
      { date: '05.04', label: 'Етап 1' },
      { date: '19.04', label: 'Етап 2' },
      { date: '03.05', label: 'Етап 3' },
    ],
    prize: 'Сертифікат від 2G Academy для топ-3 пілотів заліку Rookie',
  },
  {
    id: 'sprint-1',
    title: 'Sprint Cup Pro 1 2026',
    color: 'from-orange-500 to-red-600',
    stages: [
      { date: '26.04', label: 'Етап 1' },
      { date: '10.05', label: 'Етап 2' },
      { date: '17.05', label: 'Етап 3' },
      { date: '31.05', label: 'Етап 4' },
      { date: '28.06', label: 'Етап 5' },
    ],
    prize: 'Сертифікат від 2G: 7г марафон для топ-3 пілотів',
  },
  {
    id: 'summer-rookie-1',
    title: 'Summer Rookie Cup + Pro 2026',
    color: 'from-yellow-400 to-orange-500',
    stages: [
      { date: '24.05', label: 'Етап 1' },
      { date: '07.06', label: 'Етап 2' },
      { date: '21.06', label: 'Етап 3' },
    ],
    prize: 'Сертифікат від 2G Academy для топ-3 пілотів заліку Rookie',
  },
  {
    id: 'summer-rookie-2',
    title: 'Summer Rookie Cup 2 + Pro 2026',
    color: 'from-sky-400 to-blue-600',
    stages: [
      { date: '12.07', label: 'Етап 1' },
      { date: '26.07', label: 'Етап 2' },
      { date: '09.08', label: 'Етап 3' },
    ],
    prize: 'Сертифікат від 2G Academy для топ-3 пілотів заліку Rookie',
  },
  {
    id: 'sprint-2',
    title: 'Sprint Cup Pro 2 2026',
    color: 'from-purple-500 to-pink-600',
    stages: [
      { date: '19.07', label: 'Етап 1' },
      { date: '02.08', label: 'Етап 2' },
      { date: '16.08', label: 'Етап 3' },
      { date: '23.08', label: 'Етап 4' },
      { date: '30.08', label: 'Етап 5' },
    ],
    prize: 'Сертифікат від 2G: 7г марафон для топ-3 пілотів',
  },
];

export default function App() {
  const calendarRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen selection:bg-red-500 selection:text-white">

      {/* Main Calendar Container */}
      <div
        ref={calendarRef}
        className="min-h-screen racing-grid p-4 md:p-8 lg:p-12"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-10 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              <div className="flex items-center gap-3 mb-2 justify-center">
                <div className="h-1 w-8 bg-red-600 rounded-full" />
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-red-500 font-bold">
                  Офіційний календар
                </span>
                <div className="h-1 w-8 bg-red-600 rounded-full" />
              </div>
              <h1 className="font-display text-5xl md:text-7xl uppercase leading-none tracking-tighter mb-2">
                <span className="text-purple-800">KartFreedom</span> <br />
                <span className="text-stroke">Race League 2026</span>
              </h1>
            </motion.div>
          </header>

          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
            {CALENDAR_DATA.map((cup, index) => (
              <motion.section
                key={cup.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`glass-card p-5 rounded-2xl flex flex-col h-full border-4 ${cup.id.includes('sprint') ? 'lg:col-span-1' : ''
                  }`}
                style={{ borderLeftColor: cup.color.split(' ')[1].replace('to-', '') }}
              >
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r ${cup.color} text-black font-black text-[9px] uppercase mb-2`}>
                    <Trophy size={10} />
                    {cup.title.includes('Sprint') ? 'Sprint Pro' : 'Rookie'}
                  </div>
                  <h2 className="font-display text-2xl uppercase leading-tight mb-1">
                    {cup.title}
                  </h2>
                  <div className="flex items-start gap-2 text-white/40 italic">
                    <Award size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-tight font-medium">{cup.prize}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-2">
                    {cup.stages.map((stage, sIndex) => (
                      <div
                        key={sIndex}
                        className="bg-white/5 p-2 rounded-lg text-center group hover:bg-white/10 transition-colors"
                      >
                        <span className="block text-[8px] font-mono text-white/30 uppercase mb-1">{stage.label}</span>
                        <span className="block text-sm font-display tracking-wider">{stage.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            ))}

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-5 rounded-2xl flex flex-col justify-center items-center text-center bg-red-600/5 border-red-600/20"
            >
              <Flag size={40} className="text-red-600 mb-4 opacity-50" />
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-white/30 mb-1">Локація</span>
                  <span className="block font-display text-xl uppercase tracking-widest">KartFreedom</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-white/30 mb-1">Старт сезону</span>
                  <span className="block font-display text-xl uppercase tracking-widest text-red-500">05 Квітня</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Info */}
          <footer className="mt-8 text-center border-t border-white/5 pt-6">
            <div className="flex flex-col items-center gap-3 mb-6">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20">Офіційний партнер</span>
              <div className="flex items-center gap-6 opacity-80 hover:opacity-100 transition-all duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://m.media-amazon.com/images/I/71fXj+RIrKL._AC_UF894,1000_QL80_.jpg"
                  alt="Red Bull Logo"
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <p className="text-white/10 text-[8px] uppercase tracking-[0.5em] font-mono">
              &copy; 2026 Karting Championship
            </p>
          </footer>
        </div>

        {/* Decorative Background Elements */}
        <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l from-red-600/5 to-transparent pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-1/3 h-screen bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none -z-10" />
      </div>
    </div>
  );
}

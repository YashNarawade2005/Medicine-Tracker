/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  CalendarDays, 
  BarChart3, 
  Settings, 
  Moon, 
  Search, 
  Bell, 
  Plus, 
  CheckCircle2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  AlarmClock,
  ArrowRight,
  ShieldCheck,
  Volume2,
  Smartphone,
  User,
  Palette,
  Edit2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, Medication } from './types';
import { MOCK_USER } from './constants';
import { api, ApiError } from './services/api';
import { MedicationModal } from './components/AddMedicationModal';

// --- Shared Components ---

const Sidebar = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => {
  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medications' as View, label: 'My Medications', icon: Pill },
    { id: 'schedule' as View, label: 'Schedule', icon: CalendarDays },
    { id: 'history' as View, label: 'History & Reports', icon: BarChart3 },
    { id: 'settings' as View, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="w-[240px] h-full bg-surface-container-low border-r border-outline-variant/15 flex flex-col p-6 z-10 shrink-0">
      <div className="flex items-center gap-3 py-4 mb-8">
        <img 
          src={MOCK_USER.avatarUrl} 
          alt={MOCK_USER.name} 
          className="w-12 h-12 rounded-full shadow-sm object-cover"
        />
        <div>
          <h2 className="text-base font-semibold text-on-surface leading-tight">{MOCK_USER.name}</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">🔥 {MOCK_USER.streak} days streak</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer active:opacity-80 text-left ${
                isActive 
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/30 hover:translate-x-1'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-outline-variant/15">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-highest/30 transition-all duration-300">
          <Moon size={20} />
          <span className="text-sm font-medium">Dark Mode</span>
        </button>
      </div>
    </nav>
  );
};

const TopBar = () => {
  return (
    <header className="glass-effect h-16 w-full px-6 flex justify-between items-center z-40">
      <div className="flex items-center gap-2 text-lg font-bold text-on-surface">
        <Pill className="text-primary fill-primary" />
        <span className="tracking-tight">Did I Take It?</span>
      </div>

      <div className="flex items-center gap-4 flex-1 max-w-2xl px-12">
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input 
            type="text" 
            placeholder="Search medications..." 
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-on-surface-variant">
        <button className="p-2 hover:bg-surface-container-highest/30 transition-colors rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest"></span>
        </button>
      </div>
    </header>
  );
};// --- Screen Components ---

const DashboardView = ({ medications, onAddClick, onLog }: { medications: Medication[], onAddClick: () => void, onLog: (medId: string, idx: number, status: string) => void }) => {
  const dosesTotal = medications.reduce((acc, med) => acc + med.schedule.length, 0);
  const dosesTaken = medications.reduce((acc, med) => acc + med.schedule.filter(s => s.status === 'taken').length, 0);
  const dosesMissed = medications.reduce((acc, med) => acc + med.schedule.filter(s => s.status === 'missed').length, 0);
  const dailyAdherence = dosesTotal > 0 ? Math.round((dosesTaken / dosesTotal) * 100) : 0;
  const adherenceTotal = medications.length > 0 ? Math.round(medications.reduce((acc, med) => acc + med.adherence, 0) / medications.length) : 0;

  const [checkInVisible, setCheckInVisible] = useState(true);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayDate = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const handleQuickLog = (status: 'taken' | 'missed' = 'taken') => {
    // Find first medication with a due/upcoming dose
    for (const med of medications) {
      const dueIdx = med.schedule.findIndex(s => s.status === 'due-now' || s.status === 'upcoming');
      if (dueIdx !== -1) {
        onLog(med._id || med.id!, dueIdx, status);
        return;
      }
    }
  };

  const isAllLogged = dosesTotal > 0 && (dosesTaken + dosesMissed === dosesTotal);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">{greeting}, {MOCK_USER.name} 👋</h1>
          <p className="text-lg text-on-surface-variant mt-2 leading-relaxed">{displayDate} · Here's your medication overview</p>
        </div>
        <button 
          onClick={onAddClick}
          className="bg-gradient-primary text-on-primary px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Medication
        </button>
      </div>

      <section className="glass-effect rounded-3xl p-8 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl -z-10"></div>
        
        <div className="flex-1">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-2 block">Daily Check-in</span>
          {isAllLogged ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-3xl font-bold text-on-surface mb-2 leading-tight">You're all set for today! ✨</h2>
              <p className="text-on-surface-variant text-lg mb-8">All {dosesTotal} doses have been logged. Keep up the great streak!</p>
              <div className="flex items-center gap-4">
                <button className="bg-primary/10 text-primary px-8 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-colors flex items-center gap-2 cursor-default">
                  <ShieldCheck size={20} />
                  Complete
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-on-surface mb-2 leading-tight">Did you take your medication today?</h2>
              <p className="text-on-surface-variant text-lg mb-8">{dosesTaken} of {dosesTotal} doses logged</p>
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => handleQuickLog('taken')}
                  className="bg-secondary text-white px-8 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Yes, Taken!
                </button>
                <button 
                  onClick={() => handleQuickLog('missed')}
                  className="bg-surface-container-highest/50 text-on-surface px-8 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider hover:bg-surface-container-highest transition-all active:scale-95"
                >
                  Not Yet
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-8 bg-surface-container-lowest/50 p-6 rounded-2xl border border-outline-variant/15 backdrop-blur-sm">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-surface-container-low" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
              <circle className="text-secondary transition-all duration-700" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - dailyAdherence / 100)} strokeLinecap="round" strokeWidth="8"></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-on-surface tracking-tight">{dailyAdherence}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="text-sm font-medium text-on-surface-variant font-mono">{dosesTaken} Taken</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm font-medium text-on-surface-variant font-mono">{dosesTotal - dosesTaken - dosesMissed} Due</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <span className="text-sm font-medium text-on-surface-variant font-mono">{dosesMissed} Missed</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Current Streak', val: MOCK_USER.streak, unit: 'days', color: 'bg-tertiary-fixed-dim' },
          { label: 'Weekly Adherence', val: adherenceTotal, unit: '%', color: 'bg-secondary' },
          { label: 'Total Taken', val: dosesTaken, unit: 'doses', color: 'bg-primary' },
          { label: 'Missed', val: '0', unit: 'doses', color: 'bg-outline-variant' }
        ].map((stat, i) => (
          <div key={i} className="tonal-lift rounded-2xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${stat.color}`}></div>
            <p className="text-sm font-medium text-on-surface-variant mb-4">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-on-surface">{stat.val}</span>
              <span className="text-sm text-on-surface-variant font-medium">{stat.unit}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h3 className="text-xl font-bold text-on-surface">Upcoming Doses</h3>
        <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-outline-variant/10 bg-surface-container-low/50 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden sm:grid">
            <div className="col-span-5">Medication</div>
            <div className="col-span-3">Scheduled Time</div>
            <div className="col-span-2">Current Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          <div className="flex flex-col">
            {medications.map((med) => (
              med.schedule.map((s, idx) => (
                <div key={`${med._id}-${idx}`} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 items-center border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors last:border-0">
                  <div className="col-span-1 sm:col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                      <Pill size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-on-surface">{med.name}</h4>
                      <p className="text-sm text-on-surface-variant">{med.dosage} · {med.frequency}</p>
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <span className="text-sm font-medium text-on-surface">{s.time}</span>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === 'taken' 
                        ? 'bg-secondary-container/30 text-secondary' 
                        : s.status === 'missed' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                    }`}>
                      {s.status === 'taken' && <CheckCircle2 size={12} />}
                      {s.status}
                    </span>
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-right">
                    {s.status !== 'taken' ? (
                      <button 
                        onClick={() => onLog(med._id || med.id!, idx, 'taken')}
                        className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                      >
                        Log Dose
                      </button>
                    ) : (
                      <span className="text-xs text-on-surface-variant opacity-40 font-bold uppercase">Logged</span>
                    )}
                  </div>
                </div>
              ))
            )).flat()}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const MedicationsView = ({ medications, onAddClick, onEditClick }: { 
  medications: Medication[], 
  onAddClick: () => void,
  onEditClick: (med: Medication) => void 
}) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Paused' | 'As Needed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedications = medications.filter(med => {
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'Active' && med.status === 'active') ||
      (filter === 'Paused' && med.status === 'paused') ||
      (filter === 'As Needed' && med.status === 'as-needed');
    
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         med.dosage.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">My Medications</h1>
          <p className="text-on-surface-variant text-lg mt-2 font-medium max-w-2xl">Manage your prescriptions, dosages, and daily adherence schedules.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="bg-gradient-primary text-on-primary px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
        >
          <Plus size={18} />
          Add New Medication
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/15">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(['All', 'Active', 'Paused', 'As Needed'] as const).map((label) => (
            <button 
              key={label} 
              onClick={() => setFilter(label)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === label ? 'bg-primary text-white shadow-md' : 'hover:bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input 
            type="text" 
            placeholder="Search medications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-0 text-on-surface"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedications.length > 0 ? filteredMedications.map((med) => (
          <div key={med._id || med.id} className="tonal-lift rounded-3xl p-6 flex flex-col gap-6 relative group transition-all duration-300 hover:shadow-xl hover:shadow-on-surface/5 border border-outline-variant/5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${med.color}15`, color: med.color }}>
                  <Pill size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight">{med.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 ${
                    med.status === 'active' ? 'bg-secondary/10 text-secondary' :
                    med.status === 'paused' ? 'bg-surface-container-highest text-on-surface-variant' :
                    'bg-tertiary/10 text-tertiary'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      med.status === 'active' ? 'bg-secondary' :
                      med.status === 'paused' ? 'bg-on-surface-variant' :
                      'bg-tertiary'
                    }`}></span> 
                    {med.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-on-surface">{med.dosage.replace(/\D/g,'')}</span>
                <span className="text-on-surface-variant text-sm font-bold uppercase">{med.dosage.replace(/\d/g,'')}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-widest text-opacity-70">Frequency</p>
                  <p className="text-xs font-bold text-on-surface">{med.frequency}</p>
                </div>
                <div className="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-widest text-opacity-70">Next Dose</p>
                  <p className="text-xs font-bold text-on-surface">{med.nextDose}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-on-surface-variant">7-Day Adherence</span>
                  <span className="text-secondary">{med.adherence}%</span>
                </div>
                <div className="flex gap-1.5 h-1.5">
                  {[1,2,3,4,5,6,7].map((day) => (
                    <div 
                      key={day} 
                      className={`flex-1 rounded-full transition-all duration-1000 ${
                        day <= Math.ceil(med.adherence / 14) ? 'bg-secondary' : 'bg-surface-container-highest'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-outline-variant/15 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEditClick(med)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors"
                title="Edit Medication"
              >
                <Edit2 size={18} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant opacity-20">
              <Pill size={32} />
            </div>
            <p className="text-on-surface-variant font-medium">No medications found matching your criteria.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ScheduleView = ({ medications, onLog, onUpdateTime }: { 
  medications: Medication[], 
  onLog: (medId: string, idx: number, status: string) => void,
  onUpdateTime: (medId: string, idx: number, newTime: string) => void
}) => {
  const [editingDose, setEditingDose] = useState<{ medId: string, idx: number, time: string } | null>(null);
  const adherenceTotal = medications.length > 0 ? Math.round(medications.reduce((acc, med) => acc + med.adherence, 0) / medications.length) : 0;
  
  // Flatten and sort schedule
  const allScheduledDoses = medications.flatMap(med => 
    med.schedule.map((s, idx) => ({ 
      medId: med._id || med.id!,
      med, 
      s, 
      idx, 
      timeValue: parseInt(s.time.replace(':', ''))
    }))
  ).sort((a, b) => a.timeValue - b.timeValue);

  const handleSaveTime = () => {
    if (editingDose) {
      onUpdateTime(editingDose.medId, editingDose.idx, editingDose.time);
      setEditingDose(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-10 max-w-6xl mx-auto w-full py-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold text-on-surface tracking-tight">Today's Schedule</h1>
          <div className="inline-flex items-center gap-3 bg-surface-container-lowest py-2 px-5 rounded-full shadow-sm border border-outline-variant/10">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-primary tracking-tight">Sunday, Apr 19</span>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-surface-container-low rounded-[40px] p-10 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-[2.4rem] sm:left-[4.4rem] w-[2px] bg-outline-variant/10 -z-0"></div>
          
          <div className="space-y-14 relative z-10">
            {allScheduledDoses.length > 0 ? allScheduledDoses.map(({ med, s, idx, medId }, i) => {
              const isTaken = s.status === 'taken';
              const isMissed = s.status === 'missed';
              const isDue = s.status === 'due-now' || s.status === 'upcoming';
              const isEditing = editingDose?.medId === medId && editingDose?.idx === idx;

              return (
                <div key={`${medId}-${idx}`} className="flex gap-8 group">
                  <div className="w-16 flex-shrink-0 text-right pt-1 flex flex-col items-end gap-2">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        <input 
                          type="time" 
                          value={editingDose.time}
                          onChange={(e) => setEditingDose({ ...editingDose, time: e.target.value })}
                          className="bg-white border border-primary/30 rounded-md text-[10px] p-1 font-bold outline-none focus:ring-1 focus:ring-primary w-full"
                        />
                        <div className="flex gap-1">
                          <button 
                            onClick={handleSaveTime}
                            className="bg-primary text-white p-1 rounded-md hover:bg-primary/90 transition-colors"
                          >
                            <Check size={10} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group/time flex items-center justify-end gap-2">
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDue ? 'text-primary' : 'text-on-surface-variant/70'}`}>
                          {s.time}
                        </span>
                        {!isTaken && (
                          <button 
                            onClick={() => setEditingDose({ medId, idx, time: s.time })}
                            className="opacity-0 group-hover/time:opacity-100 p-1 text-on-surface-variant hover:text-primary transition-all"
                          >
                            <Edit2 size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative pt-1.5 text-center">
                    <div className={`w-4 h-4 rounded-full border-4 border-surface-container-low z-20 relative transition-transform group-hover:scale-125 ${
                      isTaken ? 'bg-secondary' : isMissed ? 'bg-error' : isDue ? 'bg-primary ring-4 ring-primary/20' : 'bg-outline-variant'
                    }`}>
                      {isTaken && <CheckCircle2 className="text-white p-0.5" size={14} strokeWidth={4} />}
                    </div>
                  </div>

                  <div className={`flex-1 rounded-3xl p-6 transition-all border border-outline-variant/10 ${
                    isDue ? 'glass-effect shadow-xl' : 'tonal-lift opacity-80 hover:opacity-100'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-xl font-bold ${isDue ? 'text-primary' : 'text-on-surface'}`}>{med.name}</h3>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        isTaken ? 'bg-secondary/10 text-secondary' : isMissed ? 'bg-error text-white' : isDue ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-on-surface-variant font-medium text-sm mb-4">{med.dosage} • {med.frequency}</p>
                    
                    {isTaken && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                        <Clock size={14} />
                        <span>Taken at {s.loggedTime}</span>
                      </div>
                    )}

                    {!isTaken && !isMissed && (
                      <div className="flex gap-4 mt-6">
                        <button 
                          onClick={() => onLog(med._id || med.id!, idx, 'taken')}
                          className="bg-gradient-primary text-white py-3.5 px-8 rounded-2xl flex-1 font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                          Take Dose
                        </button>
                        <button className="bg-surface-container-high text-on-surface p-3.5 rounded-2xl hover:bg-surface-container-highest transition-colors">
                          <AlarmClock size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center">
                <p className="text-on-surface-variant text-lg">No doses scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="tonal-lift rounded-[40px] p-8 space-y-8">
            <h2 className="text-2xl font-bold text-on-surface">Summary</h2>
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-surface-container-low/50 border border-outline-variant/10">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#E6E8EB" strokeWidth="8"></circle>
                  <circle 
                    className="transition-all duration-1000" 
                    cx="50" 
                    cy="50" 
                    fill="transparent" 
                    r="40" 
                    stroke="#005da7" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 * (1 - adherenceTotal / 100)} 
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold text-primary">{adherenceTotal}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Adherence</p>
                <p className="text-3xl font-extrabold text-on-surface">{adherenceTotal}%</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};

const HistoryView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-4">
    <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant opacity-20">
      <BarChart3 size={40} />
    </div>
    <h2 className="text-2xl font-bold text-on-surface">History & Reports</h2>
    <p className="text-on-surface-variant">Detailed adherence logs and weekly reports will appear here.</p>
  </motion.div>
);

const SettingsView = ({ settings, onUpdate }: { 
  settings: { remindersEnabled: boolean, sound: string, vibration: string, timeFormat: string },
  onUpdate: (key: string, value: any) => void
}) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (showSaved) {
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSaved]);

  const handleUpdate = (key: string, value: any) => {
    onUpdate(key, value);
    setShowSaved(true);
  };

  const SettingRow = ({ icon: Icon, title, description, children }: { icon: any, title: string, description: string, children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-6">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="font-bold text-on-surface">{title}</h4>
          <p className="text-sm text-on-surface-variant font-medium">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-3xl mx-auto w-full py-10 flex flex-col gap-8"
    >
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Settings</h1>
          <p className="text-on-surface-variant text-lg mt-2 font-medium">Customize your health tracking experience and notification preferences.</p>
        </div>
        <AnimatePresence>
          {showSaved && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase tracking-widest border border-secondary/10"
            >
              <CheckCircle2 size={14} />
              Auto-saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <section className="glass-effect rounded-3xl p-8 border border-outline-variant/10">
          <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-6 flex items-center gap-2">
            <Bell size={14} />
            Medication Reminders
          </h3>
          
          <div className="divide-y divide-outline-variant/10">
            <SettingRow 
              icon={Bell} 
              title="Push Notifications" 
              description="Get reminded when it is time to take your medication"
            >
              <button 
                onClick={() => handleUpdate('remindersEnabled', !settings.remindersEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.remindersEnabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.remindersEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </SettingRow>

            <SettingRow 
              icon={Volume2} 
              title="Notification Sound" 
              description="Choose the alert sound for your reminders"
            >
              <select 
                value={settings.sound}
                onChange={(e) => handleUpdate('sound', e.target.value)}
                className="bg-surface-container-low border-none rounded-lg text-sm font-bold text-on-surface px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
              >
                <option>Default Chime</option>
                <option>Gentle Pulse</option>
                <option>Medical Alert</option>
                <option>Nature Soft</option>
                <option>None</option>
              </select>
            </SettingRow>

            <SettingRow 
              icon={Smartphone} 
              title="Vibration Pattern" 
              description="Configure how your device vibrates for alerts"
            >
              <select 
                value={settings.vibration}
                onChange={(e) => handleUpdate('vibration', e.target.value)}
                className="bg-surface-container-low border-none rounded-lg text-sm font-bold text-on-surface px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
              >
                <option>Standard</option>
                <option>Long Pulse</option>
                <option>Heartbeat</option>
                <option>Short Bursts</option>
                <option>Silent</option>
              </select>
            </SettingRow>

            <div className="pt-6">
              <button 
                onClick={() => {
                  if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                      new Notification('Test Notification', { body: 'Notifications are working correctly!' });
                    } else if (Notification.permission === 'default') {
                      Notification.requestPermission();
                    }
                  }
                  // Still show in-app toast for visual confirmation
                  handleUpdate('testNotification', true);
                }}
                className="w-full py-3 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold uppercase tracking-widest text-primary transition-colors border border-outline-variant/10"
              >
                Test Notification Alert
              </button>
            </div>
          </div>
        </section>

        <section className="glass-effect rounded-3xl p-8 border border-outline-variant/10">
          <h3 className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-6 flex items-center gap-2">
            <User size={14} />
            General
          </h3>
          
          <div className="divide-y divide-outline-variant/10">
            <SettingRow 
              icon={Palette} 
              title="Appearance" 
              description="Customize the look and feel of the application"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-primary cursor-pointer hover:underline">
                Edit Theme <ChevronRight size={16} />
              </div>
            </SettingRow>

            <SettingRow 
              icon={Clock} 
              title="Time Format" 
              description="Display times in 12-hour or 24-hour format"
            >
              <div className="flex bg-surface-container-low rounded-lg p-1">
                <button 
                  onClick={() => handleUpdate('timeFormat', '12h')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${settings.timeFormat === '12h' ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}
                >
                  12h
                </button>
                <button 
                  onClick={() => handleUpdate('timeFormat', '24h')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${settings.timeFormat === '24h' ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}
                >
                  24h
                </button>
              </div>
            </SettingRow>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dbMode, setDbMode] = useState<'live' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  // Settings state lifted to App
  const [settings, setSettings] = useState(() => ({
    remindersEnabled: JSON.parse(localStorage.getItem('remindersEnabled') || 'true'),
    sound: localStorage.getItem('reminderSound') || 'Default Chime',
    vibration: localStorage.getItem('vibrationPattern') || 'Standard',
    timeFormat: localStorage.getItem('timeFormat') || '12h'
  }));

  const [toasts, setToasts] = useState<Array<{ id: string, message: string, medName: string }>>([]);
  const [notifiedDoses, setNotifiedDoses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMedications();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerNotification = (medName: string, time: string) => {
    const message = `Time to take your ${medName} (${time})`;
    
    // 1. Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Medication Reminder', {
        body: message,
        icon: '/favicon.ico'
      });
    }

    // 2. In-app Toast
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, medName }]);
    
    // Auto-remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  // Background Notification Checker
  useEffect(() => {
    if (!settings.remindersEnabled) return;

    const checkDoses = () => {
      const now = new Date();
      const HH = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${HH}:${mm}`;
      const today = now.toDateString();

      medications.forEach(med => {
        med.schedule.forEach((dose, idx) => {
          const doseId = `${med._id || med.id}-${idx}-${today}`;
          
          if (dose.time === currentTime && dose.status !== 'taken' && !notifiedDoses.has(doseId)) {
            triggerNotification(med.name, dose.time);
            setNotifiedDoses(prev => new Set(prev).add(doseId));
          }
        });
      });
    };

    const interval = setInterval(checkDoses, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [medications, settings, notifiedDoses]);

  const updateSetting = (key: string, value: any) => {
    if (key === 'testNotification') {
      triggerNotification('Test Medication', '12:00 PM');
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Persist
    const storageKeys: Record<string, string> = {
      remindersEnabled: 'remindersEnabled',
      sound: 'reminderSound',
      vibration: 'vibrationPattern',
      timeFormat: 'timeFormat'
    };
    localStorage.setItem(storageKeys[key], typeof value === 'string' ? value : JSON.stringify(value));
  };

  const fetchMedications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getMedications();
      setMedications(response.data);
      setDbMode(response.mode);
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedication = async (med: Partial<Medication>) => {
    try {
      const newMed = await api.addMedication(med);
      setMedications([...medications, newMed]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMedication = async (med: Partial<Medication>) => {
    if (!editingMedication) return;
    try {
      const medId = editingMedication._id || editingMedication.id!;
      const updatedMed = await api.updateMedication(medId, med);
      setMedications(medications.map(m => (m._id === medId || m.id === medId) ? updatedMed : m));
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingMedication(null);
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medication) => {
    setModalMode('edit');
    setEditingMedication(med);
    setIsModalOpen(true);
  };

  const handleLogDose = async (medId: string, idx: number, status: string) => {
    try {
      const updatedMed = await api.logDose(medId, idx, status, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMedications(medications.map(m => m._id === medId ? updatedMed : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDoseTime = async (medId: string, idx: number, newTime: string) => {
    try {
      const updatedMed = await api.updateDoseTime(medId, idx, newTime);
      setMedications(medications.map(m => m._id === medId ? updatedMed : m));
    } catch (err) {
      console.error(err);
    }
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      const isApiError = error instanceof ApiError;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-2xl mx-auto py-10 px-4">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-2 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight">
              {isApiError ? (error as ApiError).message : 'Connection Error'}
            </h2>
            <p className="text-on-surface-variant text-lg">
              {isApiError ? (error as ApiError).details : (error as Error).message}
            </p>
          </div>

          {isApiError && (error as ApiError).solution && (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 w-full text-left space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck size={20} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Security Guide</span>
              </div>
              <p className="text-on-surface font-medium">To fix this, follow these steps in your MongoDB Atlas dashboard:</p>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Navigate to <strong>Network Access</strong> in the security sidebar.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Click <strong>Add IP Address</strong>.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Select <strong>Allow Access From Anywhere</strong> (0.0.0.0/0) and click <strong>Confirm</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={fetchMedications}
              className="px-10 py-4 bg-gradient-primary text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-2xl font-bold uppercase tracking-widest transition-all"
            >
              Reload App
            </button>
          </div>
          
          {isApiError && (error as ApiError).technical && (
            <details className="w-full text-left mt-10">
              <summary className="text-[10px] font-bold text-on-surface-variant/40 uppercase cursor-pointer hover:text-on-surface-variant transition-colors">Technical Debug Info</summary>
              <pre className="mt-4 p-4 bg-surface-container-lowest border border-outline-variant/5 rounded-xl text-[10px] text-on-surface-variant overflow-x-auto font-mono whitespace-pre-wrap">
                {(error as ApiError).technical}
              </pre>
            </details>
          )}
        </div>
      );
    }

    switch(view) {
      case 'dashboard': return <DashboardView medications={medications} onAddClick={openAddModal} onLog={handleLogDose} />;
      case 'medications': return <MedicationsView medications={medications} onAddClick={openAddModal} onEditClick={openEditModal} />;
      case 'schedule': return <ScheduleView medications={medications} onLog={handleLogDose} onUpdateTime={handleUpdateDoseTime} />;
      case 'history': return <HistoryView />;
      case 'settings': return <SettingsView settings={settings} onUpdate={updateSetting} />;
      default: return <DashboardView medications={medications} onAddClick={openAddModal} onLog={handleLogDose} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      <Sidebar currentView={view} setView={setView} />
      
      {/* Toast Notifications */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-primary text-on-primary p-5 rounded-2xl shadow-2xl pointer-events-auto border border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-1">Medication Reminder</h4>
                  <p className="text-xs font-medium text-on-primary/90 leading-relaxed">{toast.message}</p>
                  <button 
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="mt-3 text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {dbMode === 'local' && (
          <div className="bg-primary/10 border-b border-primary/20 py-2 px-6 flex items-center justify-between glass-effect relative z-50">
            <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Offline Mode: Using Local Memory Store</span>
            </div>
            <p className="text-[10px] text-on-surface-variant hidden md:block">
              MongoDB Atlas whitelisting required for Live Mode.
            </p>
          </div>
        )}
        <TopBar />
        
        <main className="flex-1 overflow-y-auto px-6 sm:px-10">
          <AnimatePresence mode="wait">
            <React.Fragment key={view}>
              {renderView()}
            </React.Fragment>
          </AnimatePresence>
        </main>

        <MedicationModal 
          isOpen={isModalOpen}
          mode={modalMode}
          initialData={editingMedication}
          onClose={() => setIsModalOpen(false)}
          onSave={modalMode === 'add' ? handleAddMedication : handleUpdateMedication}
        />
      </div>
    </div>
  );
}

import React from 'react';
import {
  NavigationTab,
  StudentProfile,
} from '../types';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Award,
  Users,
  Image,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  LogOut,
  Sparkles,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  student: StudentProfile;
  onLogout: () => void;
  onTriggerFacialCheck: () => void;
  speakersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  student,
  onLogout,
  onTriggerFacialCheck,
  speakersCount = 5,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'visao_geral', label: 'Início', icon: GraduationCap },
    { id: 'frequencia', label: 'Frequência', icon: CheckSquare },
    { id: 'cronograma', label: 'Oficinas', icon: Calendar },
    { id: 'palestrantes', label: 'Professores', icon: Users },
    { id: 'chat_duvidas', label: 'Tira-Dúvidas', icon: MessageSquare },
    { id: 'momentos', label: 'Momentos', icon: Image },
    { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
    { id: 'certificacao', label: 'Certificação', icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Program Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight font-['Space_Grotesk'] bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 bg-clip-text text-transparent">
                  Aluno Empreendedor
                </span>
                <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                  Edição 2026.1
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                  {item.id === 'palestrantes' && (
                    <span
                      className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none transition-colors ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {speakersCount || 5}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Student Profile & Facial Status Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onTriggerFacialCheck}
              title="Biometria facial autenticada. Clique para checar novamente"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Facial OK</span>
              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                {student.facialConfidence || 98.6}%
              </span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={student.avatarUrl}
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{student.name}</p>
                <p className="text-[10px] text-slate-500">CPF: {student.cpf}</p>
              </div>

              <button
                onClick={onLogout}
                title="Sair / Trocar Aluno"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary navigation bar for medium screens (lg/md) */}
        <div className="hidden md:flex xl:hidden items-center justify-between border-t border-slate-100 py-1.5 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-secondary-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
                {item.id === 'palestrantes' && (
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none transition-colors ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {speakersCount || 5}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 py-3 space-y-1">
            <div className="px-3 py-2 mb-2 bg-slate-50 rounded-lg flex items-center gap-3">
              <img
                src={student.avatarUrl}
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">{student.name}</p>
                <p className="text-xs text-slate-500">CPF: {student.cpf}</p>
                <p className="text-[11px] text-emerald-700 font-semibold">{student.turma}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'palestrantes' && (
                      <span
                        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {speakersCount || 5}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

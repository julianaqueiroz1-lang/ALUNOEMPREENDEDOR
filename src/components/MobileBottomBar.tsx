import React from 'react';
import { NavigationTab, UserRole } from '../types';
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  MessageSquare,
  FileCheck,
  Menu,
  FileSpreadsheet
} from 'lucide-react';

interface MobileBottomBarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMenu: () => void;
  userRole?: UserRole;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenu,
  userRole = 'aluno',
}) => {
  const studentTabs: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'visao_geral', label: 'Início', icon: GraduationCap },
    { id: 'cronograma', label: 'Oficinas', icon: Calendar },
    { id: 'frequencia', label: 'Presença', icon: CheckSquare },
    { id: 'chat_duvidas', label: 'Mentor IA', icon: MessageSquare },
    { id: 'certificacao', label: 'Certificado', icon: FileCheck },
  ];

  const teacherTabs: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'area_professor', label: 'Diário Docente', icon: FileSpreadsheet },
    { id: 'frequencia', label: 'Chamada', icon: CheckSquare },
    { id: 'cronograma', label: 'Oficinas', icon: Calendar },
    { id: 'chat_duvidas', label: 'Tira-Dúvidas', icon: MessageSquare },
    { id: 'certificacao', label: 'SEDUC', icon: FileCheck },
  ];

  const tabs = userRole === 'professor' ? teacherTabs : studentTabs;

  return (
    <nav
      id="mobile-bottom-bar"
      aria-label="Navegação inferior mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 flex justify-around items-center md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.06)] print:hidden"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`bottom-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative min-w-[56px] active:scale-95 cursor-pointer ${
              isActive
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-1 bg-emerald-600 rounded-full" />
            )}
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-100/70 text-emerald-700' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Button to open more options menu */}
      <button
        id="bottom-tab-menu"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200 min-w-[56px] active:scale-95 cursor-pointer"
        aria-label="Mais opções de menu"
      >
        <div className="p-1 rounded-lg text-slate-500">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
          Mais
        </span>
      </button>
    </nav>
  );
};

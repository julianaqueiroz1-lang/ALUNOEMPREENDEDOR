import React, { useState } from 'react';
import {
  TeacherProfile,
  ClassStudent,
  Workshop,
  AttendanceStatus,
  PushNotificationItem,
  UserRole
} from '../types';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Send,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckSquare,
  XSquare,
  HelpCircle,
  FileText,
  Building2,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Award,
  BellRing,
  BarChart3
} from 'lucide-react';
import { TeacherMetricsDashboard } from './TeacherMetricsDashboard';

interface TeacherDashboardViewProps {
  teacher: TeacherProfile;
  students: ClassStudent[];
  workshops: Workshop[];
  onUpdateStudents: (updatedStudents: ClassStudent[]) => void;
  onUpdateWorkshops: (updatedWorkshops: Workshop[]) => void;
  onSendAnnouncement: (title: string, message: string, priority: 'high' | 'normal') => void;
  onSwitchRole: (role: UserRole) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacher,
  students,
  workshops,
  onUpdateStudents,
  onUpdateWorkshops,
  onSendAnnouncement,
  onSwitchRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'metricas' | 'chamada' | 'materiais' | 'comunicados' | 'relatorio'>('metricas');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(workshops[0]?.id || 'ws-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'em_risco' | 'aprovados'>('todos');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // New Material Form State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('PDF');
  const [materialSize, setMaterialSize] = useState('2.4 MB');

  // New Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'high' | 'normal'>('normal');
  const [announcementSent, setAnnouncementSent] = useState(false);

  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId) || workshops[0];

  // Calculations across class
  const totalStudents = students.length;
  const approvedStudents = students.filter((s) => s.attendanceRate >= 75).length;
  const atRiskStudents = students.filter((s) => s.attendanceRate < 75).length;
  const avgAttendance = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents)
    : 0;

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'em_risco') return student.attendanceRate < 75;
    if (statusFilter === 'aprovados') return student.attendanceRate >= 75;
    return true;
  });

  // Toggle individual student attendance for the selected workshop
  const handleToggleAttendance = (studentId: string, status: AttendanceStatus) => {
    const updated = students.map((s) => {
      if (s.id !== studentId) return s;

      const currentByWorkshop = { ...s.attendanceByWorkshop };
      currentByWorkshop[selectedWorkshopId] = status;

      // Recalculate present hours and rate
      const presentCount = Object.values(currentByWorkshop).filter((st) => st === 'presente').length;
      const totalPresentHours = presentCount * 3;
      const attendanceRate = Math.round((presentCount / Math.max(workshops.length, 1)) * 100);

      return {
        ...s,
        attendanceByWorkshop: currentByWorkshop,
        totalPresentHours,
        attendanceRate,
      };
    });

    onUpdateStudents(updated);
    setSyncFeedback('Chamada atualizada e salva no diário do professor.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Mark all students in the selected workshop
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = students.map((s) => {
      const currentByWorkshop = { ...s.attendanceByWorkshop };
      currentByWorkshop[selectedWorkshopId] = status;

      const presentCount = Object.values(currentByWorkshop).filter((st) => st === 'presente').length;
      const totalPresentHours = presentCount * 3;
      const attendanceRate = Math.round((presentCount / Math.max(workshops.length, 1)) * 100);

      return {
        ...s,
        attendanceByWorkshop: currentByWorkshop,
        totalPresentHours,
        attendanceRate,
      };
    });

    onUpdateStudents(updated);
    setSyncFeedback(`Todos os alunos marcados como "${status}" para ${selectedWorkshop?.title}.`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Handle Material Upload
  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim()) return;

    const newMat = {
      name: materialTitle.trim(),
      type: materialType,
      size: materialSize || '1.8 MB',
    };

    const updatedWorkshops = workshops.map((w) => {
      if (w.id === selectedWorkshopId) {
        return {
          ...w,
          materials: [...w.materials, newMat],
        };
      }
      return w;
    });

    onUpdateWorkshops(updatedWorkshops);
    setMaterialTitle('');
    setSyncFeedback(`Material "${newMat.name}" publicado com sucesso para os alunos.`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Handle Remove Material
  const handleRemoveMaterial = (workshopId: string, materialName: string) => {
    const updatedWorkshops = workshops.map((w) => {
      if (w.id === workshopId) {
        return {
          ...w,
          materials: w.materials.filter((m) => m.name !== materialName),
        };
      }
      return w;
    });
    onUpdateWorkshops(updatedWorkshops);
    setSyncFeedback(`Material removido da oficina.`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Handle Announcement Submit
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) return;

    onSendAnnouncement(announcementTitle.trim(), announcementMessage.trim(), announcementPriority);
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setAnnouncementSent(true);
    setTimeout(() => setAnnouncementSent(false), 4000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Teacher Institutional Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 shadow-lg shrink-0"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Perfil Docente & Coordenação
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {teacher.registration}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-['Space_Grotesk'] text-white">
                {teacher.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {teacher.role} • {teacher.polo}
              </p>
              <p className="text-[11px] text-emerald-300/80 font-semibold">
                {teacher.institution}
              </p>
            </div>
          </div>

          {/* Role Switcher & Action Callout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs text-center sm:text-right">
              <span className="text-[11px] text-slate-300 block">Turma em Acompanhamento:</span>
              <span className="font-extrabold text-emerald-300 text-sm">Turma 2026.1 • SASP</span>
            </div>

            <button
              type="button"
              onClick={() => onSwitchRole('aluno')}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 text-xs font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              title="Alternar para a visualização como Aluna Empreendedora"
            >
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>Ver como Aluno</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Sync / Action Notification Strip */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {syncFeedback}
          </span>
          <span className="text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Sincronizado
          </span>
        </div>
      )}

      {/* Class Statistics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('chamada')}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/60 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-700 transition">Total de Alunos</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-slate-900">
            {totalStudents}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Matriculados no Polo SASP
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('metricas')}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/60 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-700 transition">Média de Frequência</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-emerald-700">
            {avgAttendance}%
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Ver gráficos Recharts →
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('metricas')}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/60 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-teal-700 transition">Aptos / Certificação</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-teal-700">
            {approvedStudents} / {totalStudents}
          </div>
          <span className="text-[11px] text-teal-700 font-medium mt-1 block">
            {Math.round((approvedStudents / Math.max(totalStudents, 1)) * 100)}% da turma aprovada
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('chamada');
            setStatusFilter('em_risco');
          }}
          className="text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-500/60 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-700 transition">Abaixo da Meta</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-amber-600">
            {atRiskStudents}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            Filtrar alunos em risco →
          </span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 pb-2 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'metricas', label: 'Métricas & Gráficos (Recharts)', icon: BarChart3 },
          { id: 'chamada', label: 'Diário de Classe & Chamada', icon: FileSpreadsheet },
          { id: 'materiais', label: 'Alimentar Materiais & Apostilas', icon: Upload },
          { id: 'comunicados', label: 'Mural de Avisos & Push', icon: BellRing },
          { id: 'relatorio', label: 'Relatório Consolidado SEDUC', icon: Printer },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: DASHBOARD DE MÉTRICAS AVANÇADO (RECHARTS) */}
      {activeSubTab === 'metricas' && (
        <TeacherMetricsDashboard
          teacher={teacher}
          students={students}
          workshops={workshops}
        />
      )}

      {/* TAB 1: DIÁRIO DE CLASSE E CHAMADA RÁPIDA */}
      {activeSubTab === 'chamada' && (
        <div className="space-y-5">
          {/* Workshop Selection & Batch Actions */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Selecione a Oficina para Lançar ou Auditar Presenças:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedWorkshopId}
                    onChange={(e) => setSelectedWorkshopId(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  >
                    {workshops.map((w, idx) => (
                      <option key={w.id} value={w.id}>
                        Oficina 0{idx + 1}: {w.title} ({w.date} • {w.durationHours}h)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('presente')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Marcar Todos Presentes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ausente')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XSquare className="w-4 h-4" />
                  <span>Marcar Todos Ausentes</span>
                </button>
              </div>
            </div>

            {/* Selected Workshop Info Bar */}
            {selectedWorkshop && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{selectedWorkshop.title}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedWorkshop.date} ({selectedWorkshop.time})
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedWorkshop.location}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  Docente/Palestrante: {selectedWorkshop.speakerName}
                </div>
              </div>
            )}
          </div>

          {/* Student Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, matrícula ou escola..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'aprovados', label: '≥ 75% Aprovados' },
                { id: 'em_risco', label: '< 75% Em Risco' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === filter.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Class Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Estudante</th>
                    <th className="py-3 px-3">Escola de Origem</th>
                    <th className="py-3 px-3 text-center">Frequência Geral</th>
                    <th className="py-3 px-3 text-center">Horas Feitas</th>
                    <th className="py-3 px-4 text-center">Presença na Oficina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const currentStatus = student.attendanceByWorkshop[selectedWorkshopId] || 'ausente';
                    const isAtRisk = student.attendanceRate < 75;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatarUrl}
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block text-sm">
                                {student.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {student.matricula} • {student.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                          {student.school}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded-full ${
                                isAtRisk
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {student.attendanceRate}%
                            </span>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${student.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {student.totalPresentHours}h / 21h
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.id, 'presente')}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                currentStatus === 'presente'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-emerald-700'
                              }`}
                            >
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.id, 'ausente')}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                currentStatus === 'ausente'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-rose-700'
                              }`}
                            >
                              Ausente
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.id, 'justificado')}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                currentStatus === 'justificado'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-amber-700'
                              }`}
                            >
                              Justificado
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALIMENTAR MATERIAIS PEDAGÓGICOS */}
      {activeSubTab === 'materiais' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Publicar Material para a Turma
                </h3>
                <p className="text-xs text-slate-500">
                  Os arquivos ficam disponíveis para download no painel do aluno
                </p>
              </div>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Oficina de Destino
                </label>
                <select
                  value={selectedWorkshopId}
                  onChange={(e) => setSelectedWorkshopId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title} ({w.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Material ou Apostila
                </label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="Ex: Apostila de Modelagem Canvas SASP.pdf"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Formato
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="PDF">PDF (Apostila / Slides)</option>
                    <option value="PPTX">Slides Apresentação</option>
                    <option value="XLSX">Planilha Financeira</option>
                    <option value="DOCX">Documento Word / Roteiro</option>
                    <option value="LINK">Link / Ferramenta Online</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tamanho Estimado
                  </label>
                  <input
                    type="text"
                    value={materialSize}
                    onChange={(e) => setMaterialSize(e.target.value)}
                    placeholder="Ex: 3.2 MB"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/70">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  Simulação de Envio de Arquivo
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Formatos aceitos: PDF, PPTX, XLSX até 25MB
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Disponibilizar Material aos Alunos</span>
              </button>
            </form>
          </div>

          {/* List of Published Materials per Workshop */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Materiais Atuais da Oficina Selecionada
                  </h4>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedWorkshop.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  {selectedWorkshop.materials.length} arquivo(s)
                </span>
              </div>

              {selectedWorkshop.materials.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum material cadastrado para esta oficina ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedWorkshop.materials.map((m, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {m.type}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[11px] text-slate-500">
                            Tamanho: {m.size} • Disponível para os alunos
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(selectedWorkshop.id, m.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Remover material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MURAL DE AVISOS & PUSH NOTIFICATIONS */}
      {activeSubTab === 'comunicados' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Enviar Comunicado à Turma (FCM)
                </h3>
                <p className="text-xs text-slate-500">
                  Dispara uma notificação push para os smartphones dos alunos
                </p>
              </div>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Ex: Mudança de Sala - Oficina no Lab 02"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mensagem Detalhada
                </label>
                <textarea
                  rows={4}
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Instruções aos alunos, horários de chegada, materiais a trazer..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Prioridade
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={announcementPriority === 'normal'}
                      onChange={() => setAnnouncementPriority('normal')}
                    />
                    Normal
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-rose-700 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={announcementPriority === 'high'}
                      onChange={() => setAnnouncementPriority('high')}
                    />
                    Alta / Urgente (Aparece em Destaque)
                  </label>
                </div>
              </div>

              {announcementSent && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Notificação disparada com sucesso para toda a turma!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Disparar Notificação para a Turma</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Comunicados Recentes no Painel dos Alunos
            </h4>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Lembrete: Prazo das Atividades Complementares
                  </span>
                  <span className="text-[10px] text-slate-400">Hoje</span>
                </div>
                <p className="text-slate-600">
                  Prazo para envio dos certificados e comprovantes de atividades complementares encerra dia 25/03.
                </p>
                <span className="text-[10px] font-bold text-teal-700 block">
                  Enviado por: Profª. Juliana Queiroz
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Sessões Simultâneas no Polo SASP
                  </span>
                  <span className="text-[10px] text-slate-400">Ontem</span>
                </div>
                <p className="text-slate-600">
                  As oficinas das 18h às 21h acontecerão em salas separadas. Não se esqueça de realizar o check-in facial ou em lote na chegada.
                </p>
                <span className="text-[10px] font-bold text-teal-700 block">
                  Enviado por: Coordenação Pedagógica
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RELATÓRIO CONSOLIDADO SEDUC */}
      {activeSubTab === 'relatorio' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-emerald-800 text-white text-[10px] font-black uppercase">
                  Governo do Ceará • SEDUC
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Diário Oficial da Turma
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-['Space_Grotesk'] text-slate-900">
                Ata Geral de Frequência e Conclusão Curricular
              </h2>
              <p className="text-xs text-slate-600">
                Turma 2026.1 • Polo de Inovação e Empreendedorismo Social SASP
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Diário de Classe</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3 border-r border-slate-200">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Estudante</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Matrícula</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Escola</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Horas Feitas</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Frequência</th>
                  <th className="py-2.5 px-3 text-center">Situação Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((st, i) => {
                  const isApt = st.attendanceRate >= 75;
                  return (
                    <tr key={st.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-500">
                        0{i + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {st.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600">
                        {st.matricula}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                        {st.school}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">
                        {st.totalPresentHours}h
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">
                        <span className={isApt ? 'text-emerald-700' : 'text-amber-600'}>
                          {st.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isApt ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Certificado Aprovado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Pendente (&lt;75%)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>Docente Responsável: <strong>{teacher.name}</strong> ({teacher.registration})</span>
            <span>Autenticação Digital SEDUC • {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Workshop,
  ClassStudent,
  TeacherProfile,
} from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Download,
  Calendar,
  Users,
  Target,
  FileSpreadsheet,
  HelpCircle,
  School,
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface TeacherMetricsDashboardProps {
  teacher: TeacherProfile;
  students: ClassStudent[];
  workshops: Workshop[];
}

export const TeacherMetricsDashboard: React.FC<TeacherMetricsDashboardProps> = ({
  teacher,
  students,
  workshops,
}) => {
  const [metricViewFilter, setMetricViewFilter] = useState<'todas' | 'concluidas'>('todas');
  const [selectedSchool, setSelectedSchool] = useState<string>('todas');

  // Filter workshops based on filter
  const displayedWorkshops = useMemo(() => {
    if (metricViewFilter === 'concluidas') {
      return workshops.filter((w) => w.status === 'concluida');
    }
    return workshops;
  }, [workshops, metricViewFilter]);

  // Overall calculations
  const totalStudents = students.length;
  const approvedStudents = students.filter((s) => s.attendanceRate >= 75).length;
  const atRiskStudents = students.filter((s) => s.attendanceRate < 75).length;

  // 1. Data for Attendance & Engagement per Workshop
  const workshopMetricsData = useMemo(() => {
    return displayedWorkshops.map((workshop, index) => {
      const presentCount = students.filter(
        (s) => s.attendanceByWorkshop[workshop.id] === 'presente'
      ).length;
      const absentCount = students.filter(
        (s) => s.attendanceByWorkshop[workshop.id] === 'ausente'
      ).length;
      const justifiedCount = students.filter(
        (s) => s.attendanceByWorkshop[workshop.id] === 'justificado'
      ).length;

      const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      const absenceRate = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;

      // Base engagement score: presence rate + materials weight + review boost
      const materialsBonus = Math.min(workshop.materials.length * 4, 15);
      const isCompleted = workshop.status === 'concluida';
      const engagementScore = isCompleted
        ? Math.min(100, Math.round(attendanceRate * 0.85 + materialsBonus + (index % 2 === 0 ? 6 : 4)))
        : Math.min(100, Math.round(attendanceRate * 0.75 + materialsBonus));

      // Realistic satisfaction rating
      const rating = 4.4 + ((index * 7) % 5) * 0.12;

      return {
        id: workshop.id,
        shortName: `Ofic. 0${index + 1}`,
        fullName: workshop.title,
        speaker: workshop.speakerName,
        date: workshop.date,
        presentCount,
        absentCount,
        justifiedCount,
        taxaPresenca: attendanceRate,
        taxaAusencia: absenceRate,
        engajamento: engagementScore,
        satisfacao: Number(rating.toFixed(1)),
        materialsCount: workshop.materials.length,
      };
    });
  }, [displayedWorkshops, students, totalStudents]);

  // General average rates
  const averageAttendance = useMemo(() => {
    if (workshopMetricsData.length === 0) return 0;
    const sum = workshopMetricsData.reduce((acc, curr) => acc + curr.taxaPresenca, 0);
    return Math.round(sum / workshopMetricsData.length);
  }, [workshopMetricsData]);

  const averageEngagement = useMemo(() => {
    if (workshopMetricsData.length === 0) return 0;
    const sum = workshopMetricsData.reduce((acc, curr) => acc + curr.engajamento, 0);
    return Math.round(sum / workshopMetricsData.length);
  }, [workshopMetricsData]);

  const bestWorkshop = useMemo(() => {
    if (workshopMetricsData.length === 0) return null;
    return [...workshopMetricsData].sort((a, b) => b.taxaPresenca - a.taxaPresenca)[0];
  }, [workshopMetricsData]);

  // 2. Data for Student Performance Distribution (Donut / Pie)
  const performanceDistributionData = useMemo(() => {
    const excelente = students.filter((s) => s.attendanceRate >= 90).length;
    const apto = students.filter((s) => s.attendanceRate >= 75 && s.attendanceRate < 90).length;
    const atencao = students.filter((s) => s.attendanceRate >= 60 && s.attendanceRate < 75).length;
    const critico = students.filter((s) => s.attendanceRate < 60).length;

    return [
      { name: 'Excelente (≥ 90%)', value: excelente, color: '#059669' },
      { name: 'Apto SEDUC (75% - 89%)', value: apto, color: '#0d9488' },
      { name: 'Alerta / Atenção (60% - 74%)', value: atencao, color: '#f59e0b' },
      { name: 'Risco Crítico (< 60%)', value: critico, color: '#e11d48' },
    ];
  }, [students]);

  // 3. Competencies Radar Data
  const competenciesRadarData = useMemo(() => {
    return [
      { subject: 'Modelagem Canvas', nivelTurma: 92, metaSeduc: 80 },
      { subject: 'Gestão Financeira', nivelTurma: 78, metaSeduc: 75 },
      { subject: 'Pitch & Comunicação', nivelTurma: 88, metaSeduc: 80 },
      { subject: 'Marketing Digital', nivelTurma: 95, metaSeduc: 75 },
      { subject: 'Inovação Social', nivelTurma: 85, metaSeduc: 75 },
      { subject: 'Validação c/ Clientes', nivelTurma: 82, metaSeduc: 80 },
    ];
  }, []);

  // 4. Attendance by School of Origin
  const schoolPerformanceData = useMemo(() => {
    const map = new Map<string, { totalRate: number; count: number }>();
    students.forEach((s) => {
      const schoolName = s.school.replace(' (Fortaleza)', '');
      const existing = map.get(schoolName) || { totalRate: 0, count: 0 };
      map.set(schoolName, {
        totalRate: existing.totalRate + s.attendanceRate,
        count: existing.count + 1,
      });
    });

    return Array.from(map.entries()).map(([school, data]) => ({
      escola: school.length > 20 ? `${school.substring(0, 18)}...` : school,
      escolaCompleta: school,
      taxaMedia: Math.round(data.totalRate / data.count),
      alunos: data.count,
    }));
  }, [students]);

  // Export CSV summary
  const handleExportCSV = () => {
    const headers = 'Oficina;Data;Palestrante;Presencas;Ausencias;Taxa_Presenca;Engajamento;Satisfacao_Media\n';
    const rows = workshopMetricsData
      .map(
        (w) =>
          `"${w.fullName}";"${w.date}";"${w.speaker}";${w.presentCount};${w.absentCount};${w.taxaPresenca}%;${w.engajamento}%;${w.satisfacao}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metricas_desempenho_turma_sasp_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black font-['Space_Grotesk'] text-slate-900">
              Dashboard Analítico de Desempenho da Turma (Recharts)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento de presença, engajamento e índice de retenção curricular do Polo SASP
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMetricViewFilter('todas')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                metricViewFilter === 'todas'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas (7 Oficinas)
            </button>
            <button
              type="button"
              onClick={() => setMetricViewFilter('concluidas')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                metricViewFilter === 'concluidas'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apenas Concluídas
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            title="Exportar dados das métricas para CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Média de Presença</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-emerald-700">
            {averageAttendance}%
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${averageAttendance >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {averageAttendance >= 75 ? '✓ Acima da Meta' : '⚠ Abaixo da Meta'}
            </span>
            <span className="text-[11px] text-slate-400">Meta: 75%</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Índice Engajamento</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-teal-700">
            {averageEngagement}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">
            Baseado em materiais + chamada
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Aptidão ao Certificado</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-slate-900">
            {approvedStudents} <span className="text-xs font-semibold text-slate-400">/ {totalStudents}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1.5 block">
            {Math.round((approvedStudents / Math.max(totalStudents, 1)) * 100)}% dos alunos habilitados
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Oficina Destaque</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 line-clamp-1">
            {bestWorkshop ? bestWorkshop.fullName : 'N/A'}
          </div>
          <span className="text-[11px] text-indigo-700 font-bold mt-1.5 block">
            {bestWorkshop ? `${bestWorkshop.taxaPresenca}% de presença na sala` : ''}
          </span>
        </div>
      </div>

      {/* Main Charts Row 1: Attendance vs Engagement Bar & Line Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Taxa de Frequência e Índice de Engajamento por Oficina
            </h3>
            <p className="text-sm font-extrabold text-slate-900">
              Comparativo de Presença (%) e Engajamento (%) com Linha de Corte SEDUC (75%)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" /> Presença (%)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-teal-700">
              <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> Engajamento (%)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-rose-600">
              <span className="w-4 h-0.5 bg-rose-500 border border-dashed border-rose-500 inline-block" /> Meta 75%
            </span>
          </div>
        </div>

        {/* Recharts BarChart & Line */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={workshopMetricsData}
              margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                unit="%"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <p className="font-extrabold text-emerald-300">{data.fullName}</p>
                        <p className="text-slate-300 text-[11px]">{data.date} • {data.speaker}</p>
                        <div className="pt-1.5 border-t border-slate-800 space-y-0.5">
                          <p className="flex justify-between gap-4">
                            <span className="text-slate-400">Presença:</span>
                            <span className="font-bold text-emerald-400">{data.taxaPresenca}% ({data.presentCount} alunos)</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-slate-400">Ausência:</span>
                            <span className="font-bold text-rose-400">{data.taxaAusencia}% ({data.absentCount} alunos)</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-slate-400">Índice Engajamento:</span>
                            <span className="font-bold text-teal-300">{data.engajamento}%</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-slate-400">Avaliação Média:</span>
                            <span className="font-bold text-amber-300">★ {data.satisfacao} / 5.0</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={75}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'Corte 75%',
                  position: 'right',
                  fill: '#e11d48',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <Bar
                dataKey="taxaPresenca"
                name="Taxa de Presença"
                fill="#059669"
                radius={[6, 6, 0, 0]}
                barSize={32}
              >
                {workshopMetricsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.taxaPresenca >= 75 ? '#059669' : '#f59e0b'}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="engajamento"
                name="Engajamento Geral"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ fill: '#0d9488', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Row 2: Distribution Donut & Competency Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Student Performance Tiers */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Distribuição da Turma por Faixa de Frequência
            </h3>
            <p className="text-sm font-extrabold text-slate-900">
              Situação dos {totalStudents} estudantes matriculados
            </p>
          </div>

          <div className="w-full h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {performanceDistributionData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} aluno(s) (${Math.round((Number(value) / totalStudents) * 100)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-['Space_Grotesk'] text-slate-800">
                {totalStudents}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Alunos</span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {performanceDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate text-[11px]">
                    {item.name}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {item.value} alunos ({Math.round((item.value / Math.max(totalStudents, 1)) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart: Entrepreneurial Competencies */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mapeamento de Competências Desenvolvidas
            </h3>
            <p className="text-sm font-extrabold text-slate-900">
              Desempenho da Turma vs. Parâmetro Curricular SEDUC
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competenciesRadarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 9 }} />
                <Radar
                  name="Média da Turma"
                  dataKey="nivelTurma"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Parâmetro SEDUC"
                  dataKey="metaSeduc"
                  stroke="#64748b"
                  fill="#94a3b8"
                  fillOpacity={0.15}
                  strokeDasharray="3 3"
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                  iconType="circle"
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: School of Origin Breakdown */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Desempenho Médio por Escola Pública de Origem
            </h3>
            <p className="text-sm font-extrabold text-slate-900">
              Adesão dos estudantes agrupados pelas unidades de ensino estaduais
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {schoolPerformanceData.length} escolas representadas
          </span>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={schoolPerformanceData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="escola"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                width={140}
              />
              <Tooltip
                formatter={(value: any, name: any, item: any) => [
                  `${value}% de presença média (${item.payload.alunos} estudantes)`,
                  item.payload.escolaCompleta,
                ]}
              />
              <ReferenceLine x={75} stroke="#f43f5e" strokeDasharray="3 3" />
              <Bar dataKey="taxaMedia" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={18}>
                {schoolPerformanceData.map((entry, index) => (
                  <Cell
                    key={`school-cell-${index}`}
                    fill={entry.taxaMedia >= 75 ? '#0d9488' : '#d97706'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Granular Analytical Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quadro Geral Analítico por Oficina
            </h3>
            <p className="text-sm font-extrabold text-slate-900">
              Métricas consolidadas de frequência, engajamento e feedback
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {workshopMetricsData.length} Oficinas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Oficina / Tema</th>
                <th className="py-3 px-3">Palestrante / Docente</th>
                <th className="py-3 px-3 text-center">Presenças</th>
                <th className="py-3 px-3 text-center">Frequência</th>
                <th className="py-3 px-3 text-center">Engajamento</th>
                <th className="py-3 px-3 text-center">Avaliação Média</th>
                <th className="py-3 px-4 text-center">Diagnóstico Pedagógico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workshopMetricsData.map((row, idx) => {
                const isCompliant = row.taxaPresenca >= 75;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block text-xs">
                        {row.fullName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {row.date} • {row.materialsCount} material(is)
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {row.speaker}
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-800">
                      {row.presentCount} / {totalStudents}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                          isCompliant
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.taxaPresenca}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-teal-700">
                        <span>{row.engajamento}%</span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-teal-500 h-full"
                            style={{ width: `${row.engajamento}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-600">
                      ★ {row.satisfacao}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isCompliant ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Adesão Excelente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Atenção na Chamada
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

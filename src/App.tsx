import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  Workshop,
  Speaker,
  AttendanceRecord,
  ComplementaryActivity,
  MomentPost,
  CourseModule,
  Badge,
  NavigationTab,
  WorkshopEvaluation,
} from './types';
import {
  INITIAL_STUDENT,
  INITIAL_WORKSHOPS,
  INITIAL_SPEAKERS,
  INITIAL_ATTENDANCE,
  INITIAL_COMPLEMENTARY_ACTIVITIES,
  INITIAL_MOMENTS,
  INITIAL_MODULES,
  INITIAL_BADGES,
} from './mockData';

import { Navbar } from './components/Navbar';
import { FacialLoginModal } from './components/FacialLoginModal';
import { OverviewDashboard } from './components/OverviewDashboard';
import { AttendanceView } from './components/AttendanceView';
import { ScheduleAndWorkshopsView } from './components/ScheduleAndWorkshopsView';
import { WorkshopEvaluationModal } from './components/WorkshopEvaluationModal';
import { SpeakersView } from './components/SpeakersView';
import { ChatTiraDuvidas } from './components/ChatTiraDuvidas';
import { ComplementaryActivitiesView } from './components/ComplementaryActivitiesView';
import { MomentsGalleryView } from './components/MomentsGalleryView';
import { CourseEvolutionView } from './components/CourseEvolutionView';
import { CertificationView } from './components/CertificationView';
import { MobileBottomBar } from './components/MobileBottomBar';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  // Persistence via localStorage
  const [student, setStudent] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('ae_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, turma: 'Turma 2026.1' };
      } catch {
        return INITIAL_STUDENT;
      }
    }
    return INITIAL_STUDENT;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('ae_is_logged_in');
    // Start with false if not explicitly set, so user experiences the requested facial recognition login
    return saved === 'true';
  });

  const [showFacialModal, setShowFacialModal] = useState<boolean>(!isLoggedIn);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('visao_geral');

  const [workshops, setWorkshops] = useState<Workshop[]>(() => {
    const saved = localStorage.getItem('ae_workshops_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 7 && parsed[0]?.speakerName?.includes('Daniele')) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem('ae_workshops_v8', JSON.stringify(INITIAL_WORKSHOPS));
    return INITIAL_WORKSHOPS;
  });

  const [speakers] = useState<Speaker[]>(() => {
    const saved = localStorage.getItem('ae_speakers_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem('ae_speakers_v5', JSON.stringify(INITIAL_SPEAKERS));
    return INITIAL_SPEAKERS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('ae_attendance_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 7 && parsed[0]?.workshopTitle?.includes('Mentoria do Zero')) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem('ae_attendance_v3', JSON.stringify(INITIAL_ATTENDANCE));
    return INITIAL_ATTENDANCE;
  });

  const [activities, setActivities] = useState<ComplementaryActivity[]>(() => {
    const saved = localStorage.getItem('ae_activities');
    return saved ? JSON.parse(saved) : INITIAL_COMPLEMENTARY_ACTIVITIES;
  });

  const [moments, setMoments] = useState<MomentPost[]>(() => {
    const saved = localStorage.getItem('ae_moments');
    return saved ? JSON.parse(saved) : INITIAL_MOMENTS;
  });

  const [modules] = useState<CourseModule[]>(INITIAL_MODULES);
  const [badges] = useState<Badge[]>(INITIAL_BADGES);

  const [courseWorkloadHours, setCourseWorkloadHours] = useState<number>(() => {
    const saved = localStorage.getItem('ae_course_hours_v2');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 21;
  });

  const [evaluatingWorkshop, setEvaluatingWorkshop] = useState<Workshop | null>(null);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ae_course_hours_v2', courseWorkloadHours.toString());
  }, [courseWorkloadHours]);
  useEffect(() => {
    localStorage.setItem('ae_student', JSON.stringify(student));
  }, [student]);

  useEffect(() => {
    localStorage.setItem('ae_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('ae_workshops_v8', JSON.stringify(workshops));
  }, [workshops]);

  useEffect(() => {
    localStorage.setItem('ae_attendance_v3', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('ae_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('ae_moments', JSON.stringify(moments));
  }, [moments]);

  // Handle Login success
  const handleFacialLoginSuccess = (updatedStudent?: StudentProfile) => {
    if (updatedStudent) {
      setStudent(updatedStudent);
    }
    setIsLoggedIn(true);
    setShowFacialModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowFacialModal(true);
    localStorage.setItem('ae_is_logged_in', 'false');
  };

  // Workshop Evaluation submit
  const handleSubmitEvaluation = (workshopId: string, evaluation: WorkshopEvaluation) => {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === workshopId ? { ...w, evaluation } : w))
    );
  };

  // Attendance check-in
  const handleCheckIn = (workshopId: string) => {
    setAttendance((prev) =>
      prev.map((r) =>
        r.workshopId === workshopId
          ? {
              ...r,
              status: 'presente',
              checkInMethod: 'biometria_facial',
              checkInTime: new Date().toLocaleTimeString('pt-BR'),
            }
          : r
      )
    );
  };

  // Add new activity
  const handleAddActivity = (newActivity: ComplementaryActivity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Add new moment
  const handleAddMoment = (newMoment: MomentPost) => {
    setMoments((prev) => [newMoment, ...prev]);
  };

  // Toggle moment like
  const handleToggleLike = (momentId: string) => {
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === momentId) {
          const isLiked = !m.isLiked;
          return {
            ...m,
            isLiked,
            likes: isLiked ? m.likes + 1 : Math.max(0, m.likes - 1),
          };
        }
        return m;
      })
    );
  };

  // Ask doubt about speaker
  const handleAskDoubtAboutSpeaker = (speakerName: string, topic: string) => {
    setChatInitialQuery(
      `Olá! Tenho uma dúvida sobre ${topic} que foi abordado pelo palestrante ${speakerName}. Pode me ajudar a aprofundar?`
    );
    setCurrentTab('chat_duvidas');
  };

  // Computed metrics
  const attendedCount = attendance.filter((r) => r.status === 'presente').length;
  const attendanceRate = attendance.length > 0 ? Math.round((attendedCount / attendance.length) * 100) : 0;
  const approvedHours = activities.filter((a) => a.status === 'aprovado').reduce((acc, curr) => acc + curr.workloadHours, 0);
  const evaluatedWorkshopsCount = workshops.filter((w) => Boolean(w.evaluation)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden">
      {/* Biometric Facial Recognition Login Modal */}
      {showFacialModal && (
        <FacialLoginModal
          student={student}
          onSuccess={handleFacialLoginSuccess}
          onUpdateStudent={(updated) => setStudent(updated)}
          onClose={() => handleFacialLoginSuccess()}
        />
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
        }}
        student={student}
        onLogout={handleLogout}
        onTriggerFacialCheck={() => setShowFacialModal(true)}
        speakersCount={speakers.length}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
        {currentTab === 'visao_geral' && (
          <OverviewDashboard
            student={student}
            workshops={workshops}
            attendanceRecords={attendance}
            activities={activities}
            moments={moments}
            courseWorkloadHours={courseWorkloadHours}
            onUpdateCourseWorkloadHours={setCourseWorkloadHours}
            onNavigate={setCurrentTab}
            onOpenEvaluation={(ws) => setEvaluatingWorkshop(ws)}
            onCheckInNow={handleCheckIn}
          />
        )}

        {currentTab === 'frequencia' && (
          <AttendanceView
            records={attendance}
            student={student}
            onCheckInNow={handleCheckIn}
            onOpenFacialScanner={() => setShowFacialModal(true)}
          />
        )}

        {currentTab === 'cronograma' && (
          <ScheduleAndWorkshopsView
            workshops={workshops}
            onOpenEvaluation={(ws) => setEvaluatingWorkshop(ws)}
            onGoToSpeakers={() => setCurrentTab('palestrantes')}
            onUpdateWorkshop={(updated) => {
              setWorkshops((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
            }}
          />
        )}

        {currentTab === 'palestrantes' && (
          <SpeakersView
            speakers={speakers}
            workshops={workshops}
            onAskDoubtAboutSpeaker={handleAskDoubtAboutSpeaker}
          />
        )}

        {currentTab === 'chat_duvidas' && (
          <ChatTiraDuvidas
            student={student}
            initialQuery={chatInitialQuery}
            onClearInitialQuery={() => setChatInitialQuery('')}
          />
        )}

        {currentTab === 'atividades' && (
          <ComplementaryActivitiesView
            activities={activities}
            student={student}
            onSubmitActivity={handleAddActivity}
          />
        )}

        {currentTab === 'momentos' && (
          <MomentsGalleryView
            moments={moments}
            student={student}
            onAddMoment={handleAddMoment}
            onToggleLike={handleToggleLike}
          />
        )}

        {currentTab === 'evolucao' && (
          <CourseEvolutionView
            modules={modules}
            badges={badges}
            student={student}
            attendanceRate={attendanceRate}
            approvedHours={approvedHours}
            courseWorkloadHours={courseWorkloadHours}
            onGoToCertificate={() => setCurrentTab('certificacao')}
          />
        )}

        {currentTab === 'certificacao' && (
          <CertificationView
            student={student}
            attendanceRate={attendanceRate}
            approvedHours={approvedHours}
            evaluatedWorkshopsCount={evaluatedWorkshopsCount}
            totalWorkshopsCount={workshops.length}
            courseWorkloadHours={courseWorkloadHours}
          />
        )}
      </main>

      {/* Workshop Evaluation Modal Popup */}
      {evaluatingWorkshop && (
        <WorkshopEvaluationModal
          workshop={evaluatingWorkshop}
          onClose={() => setEvaluatingWorkshop(null)}
          onSubmitEvaluation={handleSubmitEvaluation}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Aluno Empreendedor</span>
            <span>•</span>
            <span>Programa Oficial de Formação em Startups & Inovação</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Certificação via CPF</span>
            <span>•</span>
            <span>Biometria Facial Integrada</span>
            <span>•</span>
            <span>Edição 2026.1</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMenu={() => setMobileMenuOpen((prev) => !prev)}
      />
    </div>
  );
}

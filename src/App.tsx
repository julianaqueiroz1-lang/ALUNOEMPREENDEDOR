import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  TeacherProfile,
  ClassStudent,
  UserRole,
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
  INITIAL_TEACHER,
  INITIAL_CLASS_STUDENTS,
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
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { MobileBottomBar } from './components/MobileBottomBar';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { IncomingPushToast } from './components/IncomingPushToast';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  subscribeToNotifications,
  setupFCMForegroundListener,
  DEFAULT_NOTIFICATIONS,
} from './services/fcmNotificationService';
import { PushNotificationItem } from './types';
import {
  persistAttendanceRecord,
  batchPersistAttendance,
  subscribeToStudentAttendance,
  persistWorkshopEvaluation,
  subscribeToStudentEvaluations,
  persistStudentProfile,
  testFirestoreConnection,
} from './services/firestorePersistenceService';

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
    const saved = localStorage.getItem('ae_workshops_v9');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 9 && parsed[0]?.speakerName?.includes('Daniele')) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem('ae_workshops_v9', JSON.stringify(INITIAL_WORKSHOPS));
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
    const saved = localStorage.getItem('ae_attendance_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 9 && parsed[0]?.workshopTitle?.includes('Mentoria do Zero')) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem('ae_attendance_v4', JSON.stringify(INITIAL_ATTENDANCE));
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

  // User Role State (Aluno vs Professor/Coordenador)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('ae_active_role');
    return saved === 'professor' ? 'professor' : 'aluno';
  });

  const [teacher] = useState<TeacherProfile>(INITIAL_TEACHER);

  const [classStudents, setClassStudents] = useState<ClassStudent[]>(() => {
    const saved = localStorage.getItem('ae_class_students_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_CLASS_STUDENTS;
  });

  // Firebase Cloud Messaging & Notifications State
  const [notifications, setNotifications] = useState<PushNotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [incomingToast, setIncomingToast] = useState<PushNotificationItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ae_active_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('ae_class_students_v1', JSON.stringify(classStudents));
  }, [classStudents]);

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
    localStorage.setItem('ae_workshops_v9', JSON.stringify(workshops));
  }, [workshops]);

  useEffect(() => {
    localStorage.setItem('ae_attendance_v4', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('ae_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('ae_moments', JSON.stringify(moments));
  }, [moments]);

  // Real-time Firestore synchronization for Attendance and Workshop Evaluations
  useEffect(() => {
    testFirestoreConnection()
      .then((status) => {
        console.log('[Firestore App] Status de inicialização do banco:', status);
      })
      .catch((err) => {
        console.info('[Firestore App] Inicializado com suporte offline local:', err?.message || err);
      });

    // Persist current student profile in Firestore
    persistStudentProfile(student);

    // 1. Subscribe to student attendance in Firestore
    const unsubscribeAttendance = subscribeToStudentAttendance(student.id, (remoteRecords) => {
      if (remoteRecords && remoteRecords.length > 0) {
        setAttendance((localRecords) => {
          return localRecords.map((loc) => {
            const remote = remoteRecords.find((r) => r.workshopId === loc.workshopId);
            return remote ? { ...loc, ...remote } : loc;
          });
        });
      } else {
        // Initialize remote Firestore with baseline attendance if empty
        batchPersistAttendance(student.id, attendance);
      }
    });

    // 2. Subscribe to workshop evaluations in Firestore
    const unsubscribeEvaluations = subscribeToStudentEvaluations(student.id, (remoteEvals) => {
      if (remoteEvals && Object.keys(remoteEvals).length > 0) {
        setWorkshops((prevWorkshops) =>
          prevWorkshops.map((w) => {
            const ev = remoteEvals[w.id];
            return ev ? { ...w, evaluation: ev } : w;
          })
        );
      }
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeEvaluations();
    };
  }, [student.id]);

  // Real-time Push Notifications via FCM & Firestore
  useEffect(() => {
    // 1. Listen to real-time notification alerts (new workshops & activity deadlines)
    const unsubscribeNotifications = subscribeToNotifications(student.id, (remoteNotifs) => {
      setNotifications(remoteNotifs);
    });

    // 2. Listen to foreground FCM messages
    const unsubscribeForegroundFCM = setupFCMForegroundListener((incoming) => {
      setIncomingToast(incoming);
    });

    // 3. Handle tab navigation events from notifications
    const handleNavigateCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<NavigationTab>;
      if (customEvent.detail) {
        setCurrentTab(customEvent.detail);
      }
    };
    window.addEventListener('NAVIGATE_TAB', handleNavigateCustomEvent);

    // 4. Handle Service Worker messages when user clicks on background push notification
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TAB' && event.data.tab) {
        setCurrentTab(event.data.tab as NavigationTab);
      }
    };
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      unsubscribeNotifications();
      unsubscribeForegroundFCM();
      window.removeEventListener('NAVIGATE_TAB', handleNavigateCustomEvent);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [student.id]);

  // Handle Login success
  const handleFacialLoginSuccess = (updatedStudent?: StudentProfile) => {
    if (updatedStudent) {
      setStudent(updatedStudent);
      persistStudentProfile(updatedStudent);
    }
    setIsLoggedIn(true);
    setShowFacialModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowFacialModal(true);
    localStorage.setItem('ae_is_logged_in', 'false');
  };

  // Workshop Evaluation submit with Firestore persistence
  const handleSubmitEvaluation = (workshopId: string, evaluation: WorkshopEvaluation) => {
    const workshop = workshops.find((w) => w.id === workshopId);
    setWorkshops((prev) =>
      prev.map((w) => (w.id === workshopId ? { ...w, evaluation } : w))
    );
    // Persist to Cloud Firestore database
    persistWorkshopEvaluation(student.id, workshopId, evaluation, workshop?.title);
  };

  // Attendance check-in with Firestore persistence
  const handleCheckIn = (workshopId: string) => {
    const checkInTime = new Date().toLocaleTimeString('pt-BR');
    let targetRecord: AttendanceRecord | undefined;

    setAttendance((prev) =>
      prev.map((r) => {
        if (r.workshopId === workshopId) {
          targetRecord = {
            ...r,
            status: 'presente',
            checkInMethod: 'biometria_facial',
            checkInTime,
          };
          return targetRecord;
        }
        return r;
      })
    );

    if (targetRecord) {
      persistAttendanceRecord(student.id, targetRecord);
    }
  };

  // Batch check-in with atomic Firestore writeBatch persistence for simultaneous workshops
  const handleBatchCheckIn = (workshopIds: string[]) => {
    const checkInTime = new Date().toLocaleTimeString('pt-BR');
    const updatedRecords: AttendanceRecord[] = [];

    setAttendance((prev) =>
      prev.map((r) => {
        if (workshopIds.includes(r.workshopId)) {
          const updated: AttendanceRecord = {
            ...r,
            status: 'presente',
            checkInMethod: 'batch_simultaneo',
            checkInTime,
          };
          updatedRecords.push(updated);
          return updated;
        }
        return r;
      })
    );

    if (updatedRecords.length > 0) {
      batchPersistAttendance(student.id, updatedRecords);
    }
  };

  // Reset simultaneous records for testing/demonstration purposes
  const handleResetSimultaneousRecords = (workshopIds: string[]) => {
    const updatedRecords: AttendanceRecord[] = [];

    setAttendance((prev) =>
      prev.map((r) => {
        if (workshopIds.includes(r.workshopId)) {
          const reset: AttendanceRecord = {
            ...r,
            status: 'ausente',
            checkInMethod: 'manual',
            checkInTime: '',
          };
          updatedRecords.push(reset);
          return reset;
        }
        return r;
      })
    );

    if (updatedRecords.length > 0) {
      batchPersistAttendance(student.id, updatedRecords);
    }
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

  // Handle Role Switch
  const handleSwitchRole = (role: UserRole) => {
    setUserRole(role);
    if (role === 'professor') {
      setCurrentTab('area_professor');
    } else {
      setCurrentTab('visao_geral');
    }
  };

  // Handle Teacher Announcement
  const handleSendTeacherAnnouncement = (title: string, message: string, priority: 'high' | 'normal') => {
    const newNotif: PushNotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      body: message,
      type: 'announcement',
      targetStudentId: 'all',
      targetTab: 'visao_geral',
      date: 'Agora',
      read: false,
      priority,
      metadata: {
        activityId: 'mural-docente',
      },
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setIncomingToast(newNotif);
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
        teacher={teacher}
        userRole={userRole}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        onTriggerFacialCheck={() => setShowFacialModal(true)}
        speakersCount={speakers.length}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
        {/* PWA Home Screen Install Banner for Mobile & Desktop */}
        <PWAInstallButton variant="banner" className="mb-4" />

        {/* Role Switcher Floating Header Banner */}
        <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shadow-sm border border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
              {userRole === 'aluno' ? '🎓' : '👩‍🏫'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white block">
                  {userRole === 'aluno'
                    ? 'Modo Estudante: Mariana Vasconcelos (Turma 2026.1)'
                    : 'Modo Docente: Profª. Juliana Queiroz (Coordenadora SEDUC)'}
                </span>
                <span className="hidden md:inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-white/15 text-emerald-300">
                  {userRole === 'aluno' ? 'Aluno Ativo' : 'Acesso Gestão'}
                </span>
              </div>
              <span className="text-[11px] text-slate-300">
                {userRole === 'aluno'
                  ? 'Você pode alternar a qualquer instante para testar a chamada em lote e envio de materiais.'
                  : 'Gerencie chamadas em lote, auditória de frequência e materiais pedagógicos para o Polo SASP.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {userRole === 'aluno' ? (
              <button
                type="button"
                onClick={() => handleSwitchRole('professor')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Acessar Área do Professor</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSwitchRole('aluno')}
                className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Voltar para Visão do Aluno</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {currentTab === 'area_professor' && (
          <TeacherDashboardView
            teacher={teacher}
            students={classStudents}
            workshops={workshops}
            onUpdateStudents={setClassStudents}
            onUpdateWorkshops={setWorkshops}
            onSendAnnouncement={handleSendTeacherAnnouncement}
            onSwitchRole={handleSwitchRole}
          />
        )}

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
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
          />
        )}

        {currentTab === 'frequencia' && (
          <AttendanceView
            records={attendance}
            student={student}
            onCheckInNow={handleCheckIn}
            onBatchCheckIn={handleBatchCheckIn}
            onResetSimultaneousRecords={handleResetSimultaneousRecords}
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

      {/* FCM Push Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        student={student}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Real-time Push Notification Floating Toast */}
      <IncomingPushToast
        notification={incomingToast}
        onClose={() => setIncomingToast(null)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

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
        userRole={userRole}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Offline Status & Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}

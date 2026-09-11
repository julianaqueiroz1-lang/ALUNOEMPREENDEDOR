export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  cpf: string; // Formatted 000.000.000-00
  matricula: string;
  courseName: string;
  turma: string;
  institution: string;
  avatarUrl: string;
  facialEnrolled: boolean;
  facialConfidence?: number;
  lastLogin?: string;
}

export type AttendanceStatus = 'presente' | 'ausente' | 'justificado';

export interface AttendanceRecord {
  id: string;
  workshopId: string;
  workshopTitle: string;
  date: string;
  time: string;
  hours: number;
  status: AttendanceStatus;
  checkInMethod?: 'biometria_facial' | 'qr_code' | 'manual' | 'online_ead';
  checkInTime?: string;
  location: string;
}

export interface WorkshopEvaluation {
  rating: number; // 1 to 5
  speakerRating: number; // 1 to 5
  contentApplicability: number; // 1 to 5
  feedback: string;
  submittedAt: string;
}

export interface Workshop {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  durationHours: number;
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  location: string;
  description: string;
  tags: string[];
  status: 'concluida' | 'hoje' | 'proxima';
  evaluation?: WorkshopEvaluation;
  materials: { name: string; type: string; size: string }[];
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  company: string;
  bio: string;
  avatar: string;
  expertise: string[];
  workshopIds: string[];
  linkedinUrl: string;
  email: string;
}

export interface ComplementaryActivity {
  id: string;
  title: string;
  category: 'Curso Online' | 'Visita Técnica' | 'Leitura de Livro' | 'Pitch Gravado' | 'Mentoria' | 'Outro';
  workloadHours: number;
  date: string;
  description: string;
  proofFileName?: string;
  proofFileData?: string;
  status: 'aprovado' | 'em_analise' | 'pendente';
  feedback?: string;
}

export interface MomentPost {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  date: string;
  authorName: string;
  authorAvatar: string;
  tags: string[];
  likes: number;
  isLiked?: boolean;
}

export interface CourseModule {
  id: string;
  code: string;
  title: string;
  description: string;
  totalHours: number;
  completedHours: number;
  status: 'concluido' | 'em_andamento' | 'bloqueado';
  competencies: string[];
}

export interface Badge {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'local_mentor' | 'local_mentor_fallback';
  speakerName?: string;
  speakerAvatar?: string;
}

export type NavigationTab = 
  | 'visao_geral'
  | 'frequencia'
  | 'cronograma'
  | 'palestrantes'
  | 'chat_duvidas'
  | 'atividades'
  | 'momentos'
  | 'evolucao'
  | 'certificacao';

import { doc, setDoc } from 'firebase/firestore';
import { AttendanceRecord, WorkshopEvaluation, StudentProfile } from '../types';
import {
  firebaseApp,
  firestoreDb,
  testFirestoreConnection,
  persistAttendanceRecord,
  persistWorkshopEvaluation,
  persistStudentProfile
} from '../services/firestorePersistenceService';

export const app = firebaseApp;
export const db = firestoreDb;
export { testFirestoreConnection };

/**
 * Registra a presença do aluno no Firestore em tempo real
 */
export async function recordAttendanceInFirestore(record: AttendanceRecord, studentId: string = 'aluno_juliana'): Promise<void> {
  await persistAttendanceRecord(studentId, record);
}

/**
 * Salva avaliação de oficina no Firestore
 */
export async function saveWorkshopEvaluationToFirestore(
  evaluation: WorkshopEvaluation,
  workshopId?: string,
  studentId?: string
): Promise<void> {
  const wId = workshopId || evaluation.workshopId || `workshop_${Date.now()}`;
  const sId = studentId || evaluation.studentId || 'aluno_juliana';
  await persistWorkshopEvaluation(sId, wId, evaluation);
}

/**
 * Salva ou atualiza perfil do aluno no Firestore
 */
export async function saveStudentProfileToFirestore(student: StudentProfile): Promise<void> {
  await persistStudentProfile(student);
}

/**
 * Cria uma nova sessão limpa de atendimento educacional no Firestore
 */
export async function createCleanAssistantSession(studentId: string): Promise<string> {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const docRef = doc(db, 'chat_sessions', sessionId);
    await setDoc(docRef, {
      sessionId,
      studentId,
      createdAt: new Date().toISOString(),
      status: 'active',
      promptInstruction: 'Você é um assistente educacional para este aluno. Esta é uma nova sessão. Não assuma nenhum contexto ou histórico anterior a esta conversa atual.'
    });
    console.log(`[Firestore] Nova sessão limpa criada: ${sessionId}`);
  } catch (err) {
    console.warn('[Firestore] Aviso ao registrar sessão:', err);
  }
  return sessionId;
}

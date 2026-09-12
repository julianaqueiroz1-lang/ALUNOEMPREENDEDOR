import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceRecord, WorkshopEvaluation, ComplementaryActivity, StudentProfile } from '../types';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// State tracking connection status
let isConnectionVerified = false;

// Test connection on boot as mandated by security and verification guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnectionVerified = true;
    console.log('[Firestore] Conexão com o banco de dados nuvem verificada com sucesso.');
    return true;
  } catch (error: any) {
    // If the doc doesn't exist, getDocFromServer still successfully connects to the server!
    if (error?.code === 'not-found' || error?.message?.includes('not found')) {
      isConnectionVerified = true;
      return true;
    }
    console.warn('[Firestore] Status de conexão:', error?.message || error);
    return false;
  }
}

// Initial boot check
testFirestoreConnection();

/**
 * Registra a presença do aluno no Firestore em tempo real
 */
export async function recordAttendanceInFirestore(record: AttendanceRecord): Promise<void> {
  try {
    const docRef = doc(db, 'attendance', record.id);
    await setDoc(docRef, {
      ...record,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firestore] Presença gravada para oficina: ${record.workshopTitle}`);
  } catch (err) {
    console.error('[Firestore] Erro ao gravar presença:', err);
  }
}

/**
 * Salva avaliação de oficina no Firestore
 */
export async function saveWorkshopEvaluationToFirestore(
  evaluation: WorkshopEvaluation,
  workshopId?: string,
  studentId?: string
): Promise<void> {
  try {
    const wId = workshopId || evaluation.workshopId || `workshop_${Date.now()}`;
    const sId = studentId || evaluation.studentId || 'aluno_atual';
    const docRef = doc(db, 'evaluations', `${wId}_${sId}`);
    await setDoc(docRef, {
      ...evaluation,
      workshopId: wId,
      studentId: sId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firestore] Avaliação salva para oficina ${wId}`);
  } catch (err) {
    console.error('[Firestore] Erro ao salvar avaliação:', err);
  }
}

/**
 * Salva atividade complementar no Firestore
 */
export async function saveActivityToFirestore(activity: ComplementaryActivity): Promise<void> {
  try {
    const docRef = doc(db, 'activities', activity.id);
    await setDoc(docRef, {
      ...activity,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firestore] Atividade complementar salva: ${activity.title}`);
  } catch (err) {
    console.error('[Firestore] Erro ao salvar atividade complementar:', err);
  }
}

/**
 * Salva ou atualiza perfil do aluno no Firestore
 */
export async function saveStudentProfileToFirestore(student: StudentProfile): Promise<void> {
  try {
    const docRef = doc(db, 'students', student.id);
    await setDoc(docRef, {
      ...student,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firestore] Perfil do aluno sincronizado: ${student.name}`);
  } catch (err) {
    console.error('[Firestore] Erro ao salvar perfil:', err);
  }
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

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceRecord, WorkshopEvaluation, StudentProfile } from '../types';

// Silence transient backend retry logs in the browser console
try {
  setLogLevel('error');
} catch {}

/**
 * Firebase App & Firestore Database Initialization
 * Configured with experimentalAutoDetectLongPolling and persistent local cache
 * to prevent [code=unavailable] errors in iframe and sandbox environments.
 */
export const firebaseApp: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(firebaseApp);

function initFirestoreInstance(): Firestore {
  const dbId = firebaseConfig.firestoreDatabaseId || undefined;
  try {
    return initializeFirestore(
      firebaseApp,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      dbId
    );
  } catch {
    try {
      return initializeFirestore(
        firebaseApp,
        {
          experimentalAutoDetectLongPolling: true,
        },
        dbId
      );
    } catch {
      return dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    }
  }
}

export const firestoreDb: Firestore = initFirestoreInstance();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirestoreConnectionStatus {
  connected: boolean;
  databaseId: string;
  projectId: string;
  timestamp: string;
  error?: string;
}

/**
 * Validates connection to the Firestore instance with graceful offline fallback
 */
export async function testFirestoreConnection(): Promise<FirestoreConnectionStatus> {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  const projId = firebaseConfig.projectId;

  try {
    const probeDoc = doc(firestoreDb, '_health', 'status');
    const probePromise = getDocFromServer(probeDoc);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 3500)
    );
    await Promise.race([probePromise, timeoutPromise]);

    return {
      connected: true,
      databaseId: dbId,
      projectId: projId,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err?.code === 'not-found' || err?.message?.includes('not found')) {
      return {
        connected: true,
        databaseId: dbId,
        projectId: projId,
        timestamp: new Date().toISOString(),
      };
    }

    const isOfflineOrUnavailable =
      err?.code === 'unavailable' ||
      err?.message?.includes('unavailable') ||
      err?.message?.includes('offline') ||
      err?.message?.includes('timeout');

    if (isOfflineOrUnavailable) {
      console.info('[Firestore Service] Operando em modo offline com persistência local e fila de sincronização.');
    } else {
      console.warn('[Firestore Service] Verificação de conexão:', err?.message || err);
    }

    return {
      connected: !isOfflineOrUnavailable,
      databaseId: dbId,
      projectId: projId,
      timestamp: new Date().toISOString(),
      error: isOfflineOrUnavailable ? 'Modo offline local ativo' : (err?.message || String(err)),
    };
  }
}

/* =========================================================================
 * 1. STUDENT ATTENDANCE PERSISTENCE SERVICE & OFFLINE QUEUE
 * ========================================================================= */

const ATTENDANCE_COLLECTION = 'attendance';
const OFFLINE_ATTENDANCE_QUEUE_KEY = 'ae_offline_attendance_queue';

export interface OfflineSyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
  lastError?: string;
}

type SyncListener = (status: OfflineSyncStatus) => void;
const syncListeners: Set<SyncListener> = new Set();

let currentSyncStatus: OfflineSyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: getStoredOfflineQueue().length,
  isSyncing: false,
};

function notifySyncListeners() {
  syncListeners.forEach((listener) => {
    try {
      listener({ ...currentSyncStatus });
    } catch (e) {
      console.warn('Erro em listener de sync:', e);
    }
  });
}

export function subscribeOfflineSync(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener({ ...currentSyncStatus });
  return () => {
    syncListeners.delete(listener);
  };
}

export function getStoredOfflineQueue(): { studentId: string; record: AttendanceRecord }[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_ATTENDANCE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredOfflineQueue(queue: { studentId: string; record: AttendanceRecord }[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_ATTENDANCE_QUEUE_KEY, JSON.stringify(queue));
    currentSyncStatus.pendingCount = queue.length;
    notifySyncListeners();
  } catch (e) {
    console.warn('[Offline Queue] Erro ao salvar fila offline:', e);
  }
}

function queueAttendanceRecord(studentId: string, record: AttendanceRecord) {
  const queue = getStoredOfflineQueue();
  // Filter out any duplicate for this student + workshopId
  const filtered = queue.filter(
    (item) => !(item.studentId === studentId && item.record.workshopId === record.workshopId)
  );
  filtered.push({ studentId, record });
  saveStoredOfflineQueue(filtered);
  console.log(`[Offline Queue] Presença enfileirada para envio: ${record.workshopTitle}`);
}

/**
 * Flushes all pending offline attendance records to Firestore using writeBatch
 */
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getStoredOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  currentSyncStatus.isSyncing = true;
  notifySyncListeners();

  try {
    const batch = writeBatch(firestoreDb);

    for (const item of queue) {
      const docId = `${item.studentId}_${item.record.workshopId}`;
      const docRef = doc(firestoreDb, ATTENDANCE_COLLECTION, docId);

      const payload = {
        id: item.record.id,
        workshopId: item.record.workshopId,
        workshopTitle: item.record.workshopTitle,
        studentId: item.studentId,
        date: item.record.date,
        time: item.record.time,
        hours: item.record.hours,
        status: item.record.status,
        checkInMethod: item.record.checkInMethod || 'manual',
        checkInTime: item.record.checkInTime || '',
        location: item.record.location,
        isSimultaneous: Boolean(item.record.isSimultaneous),
        simultaneousGroupId: item.record.simultaneousGroupId || '',
        syncedFromOfflineQueue: true,
        updatedAt: new Date().toISOString(),
      };

      batch.set(docRef, payload, { merge: true });
    }

    await batch.commit();
    const count = queue.length;
    saveStoredOfflineQueue([]);

    currentSyncStatus.isSyncing = false;
    currentSyncStatus.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
    notifySyncListeners();

    console.log(`[Offline Queue] ${count} presenças sincronizadas com sucesso no Firestore!`);
    return { synced: count, failed: 0 };
  } catch (error: any) {
    console.warn('[Offline Queue] Erro ao sincronizar fila offline:', error);
    currentSyncStatus.isSyncing = false;
    currentSyncStatus.lastError = error?.message || 'Falha na sincronização';
    notifySyncListeners();
    return { synced: 0, failed: queue.length };
  }
}

// Setup network event listeners in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Network] Conexão restabelecida. Iniciando sincronização do Firestore...');
    currentSyncStatus.isOnline = true;
    notifySyncListeners();
    flushOfflineQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[Network] Sem conexão com a internet. Ativando modo offline...');
    currentSyncStatus.isOnline = false;
    notifySyncListeners();
  });
}

/**
 * Persists an individual student attendance record into Firestore.
 * If offline or write fails, queues seamlessly to local offline queue.
 */
export async function persistAttendanceRecord(
  studentId: string,
  record: AttendanceRecord
): Promise<boolean> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    queueAttendanceRecord(studentId, record);
    return true;
  }

  try {
    const docId = `${studentId}_${record.workshopId}`;
    const docRef = doc(firestoreDb, ATTENDANCE_COLLECTION, docId);

    const payload = {
      id: record.id,
      workshopId: record.workshopId,
      workshopTitle: record.workshopTitle,
      studentId: studentId,
      date: record.date,
      time: record.time,
      hours: record.hours,
      status: record.status,
      checkInMethod: record.checkInMethod || 'manual',
      checkInTime: record.checkInTime || '',
      location: record.location,
      isSimultaneous: Boolean(record.isSimultaneous),
      simultaneousGroupId: record.simultaneousGroupId || '',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    currentSyncStatus.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
    notifySyncListeners();
    console.log(`[Firestore Service] Presença sincronizada: ${record.workshopTitle} (${record.status})`);
    return true;
  } catch (error) {
    console.warn('[Firestore Service] Falha ao persistir online. Enfileirando offline:', error);
    queueAttendanceRecord(studentId, record);
    return true;
  }
}

/**
 * Batch saves or initializes student attendance in Firestore.
 * Supports offline queueing if internet is down.
 */
export async function batchPersistAttendance(
  studentId: string,
  records: AttendanceRecord[]
): Promise<boolean> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    records.forEach((r) => queueAttendanceRecord(studentId, r));
    return true;
  }

  try {
    const batch = writeBatch(firestoreDb);

    for (const record of records) {
      const docId = `${studentId}_${record.workshopId}`;
      const docRef = doc(firestoreDb, ATTENDANCE_COLLECTION, docId);

      const payload = {
        id: record.id,
        workshopId: record.workshopId,
        workshopTitle: record.workshopTitle,
        studentId: studentId,
        date: record.date,
        time: record.time,
        hours: record.hours,
        status: record.status,
        checkInMethod: record.checkInMethod || 'manual',
        checkInTime: record.checkInTime || '',
        location: record.location,
        isSimultaneous: Boolean(record.isSimultaneous),
        simultaneousGroupId: record.simultaneousGroupId || '',
        updatedAt: new Date().toISOString(),
      };

      batch.set(docRef, payload, { merge: true });
    }

    await batch.commit();
    currentSyncStatus.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
    notifySyncListeners();
    console.log(`[Firestore Service] Lote de ${records.length} presenças sincronizado.`);
    return true;
  } catch (error) {
    console.warn('[Firestore Service] Erro ao sincronizar lote online. Enfileirando offline:', error);
    records.forEach((r) => queueAttendanceRecord(studentId, r));
    return true;
  }
}

/**
 * Fetches all attendance records for a specific student from Firestore.
 */
export async function fetchStudentAttendance(
  studentId: string
): Promise<AttendanceRecord[] | null> {
  try {
    const q = query(
      collection(firestoreDb, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const records: AttendanceRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        id: data.id || docSnap.id,
        workshopId: data.workshopId,
        workshopTitle: data.workshopTitle,
        date: data.date,
        time: data.time,
        hours: Number(data.hours) || 2,
        status: data.status,
        checkInMethod: data.checkInMethod,
        checkInTime: data.checkInTime,
        location: data.location || 'Polo SASP / Remoto',
      });
    });

    return records;
  } catch (error) {
    console.warn('[Firestore Service] Falha ao consultar presenças:', error);
    return null;
  }
}

/**
 * Subscribes to real-time attendance changes for a student.
 */
export function subscribeToStudentAttendance(
  studentId: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const q = query(
    collection(firestoreDb, ATTENDANCE_COLLECTION),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: data.id || docSnap.id,
          workshopId: data.workshopId,
          workshopTitle: data.workshopTitle,
          date: data.date,
          time: data.time,
          hours: Number(data.hours) || 2,
          status: data.status,
          checkInMethod: data.checkInMethod,
          checkInTime: data.checkInTime,
          location: data.location || 'Polo SASP / Remoto',
        });
      });
      onUpdate(records);
    },
    (err) => {
      console.warn('[Firestore Service] Listener de presenças encontrou aviso:', err);
      if (onError) onError(err);
    }
  );
}

/* =========================================================================
 * 2. WORKSHOP EVALUATIONS PERSISTENCE SERVICE
 * ========================================================================= */

const EVALUATIONS_COLLECTION = 'evaluations';

/**
 * Persists a workshop evaluation submitted by a student.
 */
export async function persistWorkshopEvaluation(
  studentId: string,
  workshopId: string,
  evaluation: WorkshopEvaluation,
  workshopTitle?: string
): Promise<boolean> {
  try {
    const docId = `${workshopId}_${studentId}`;
    const docRef = doc(firestoreDb, EVALUATIONS_COLLECTION, docId);

    const payload = {
      id: docId,
      workshopId,
      workshopTitle: workshopTitle || '',
      studentId,
      rating: evaluation.rating,
      speakerRating: evaluation.speakerRating,
      contentApplicability: evaluation.contentApplicability,
      feedback: evaluation.feedback,
      submittedAt: evaluation.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore Service] Avaliação salva com sucesso para a oficina: ${workshopId}`);
    return true;
  } catch (error) {
    console.error('[Firestore Service] Erro ao salvar avaliação de oficina:', error);
    return false;
  }
}

/**
 * Fetches all workshop evaluations submitted by a student.
 * Returns a map of workshopId -> WorkshopEvaluation.
 */
export async function fetchStudentEvaluations(
  studentId: string
): Promise<Record<string, WorkshopEvaluation>> {
  try {
    const q = query(
      collection(firestoreDb, EVALUATIONS_COLLECTION),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);
    const evalsMap: Record<string, WorkshopEvaluation> = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.workshopId) {
        evalsMap[data.workshopId] = {
          workshopId: data.workshopId,
          studentId: data.studentId,
          rating: Number(data.rating) || 5,
          speakerRating: Number(data.speakerRating) || 5,
          contentApplicability: Number(data.contentApplicability) || 5,
          feedback: data.feedback || '',
          submittedAt: data.submittedAt || '',
        };
      }
    });

    return evalsMap;
  } catch (error) {
    console.warn('[Firestore Service] Falha ao consultar avaliações:', error);
    return {};
  }
}

/**
 * Subscribes to real-time workshop evaluation updates for a student.
 */
export function subscribeToStudentEvaluations(
  studentId: string,
  onUpdate: (evaluations: Record<string, WorkshopEvaluation>) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const q = query(
    collection(firestoreDb, EVALUATIONS_COLLECTION),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const evalsMap: Record<string, WorkshopEvaluation> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.workshopId) {
          evalsMap[data.workshopId] = {
            workshopId: data.workshopId,
            studentId: data.studentId,
            rating: Number(data.rating) || 5,
            speakerRating: Number(data.speakerRating) || 5,
            contentApplicability: Number(data.contentApplicability) || 5,
            feedback: data.feedback || '',
            submittedAt: data.submittedAt || '',
          };
        }
      });
      onUpdate(evalsMap);
    },
    (err) => {
      console.warn('[Firestore Service] Listener de avaliações encontrou aviso:', err);
      if (onError) onError(err);
    }
  );
}

/* =========================================================================
 * 3. STUDENT PROFILE PERSISTENCE
 * ========================================================================= */

const STUDENTS_COLLECTION = 'students';

/**
 * Persists or updates a student profile document in Firestore.
 */
export async function persistStudentProfile(
  student: StudentProfile
): Promise<boolean> {
  try {
    const docRef = doc(firestoreDb, STUDENTS_COLLECTION, student.id);
    await setDoc(
      docRef,
      {
        ...student,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore Service] Perfil do aluno salvo: ${student.name}`);
    return true;
  } catch (error) {
    console.error('[Firestore Service] Erro ao salvar perfil do aluno:', error);
    return false;
  }
}

/**
 * Fetches a student profile by ID from Firestore.
 */
export async function fetchStudentProfile(
  studentId: string
): Promise<StudentProfile | null> {
  try {
    const docRef = doc(firestoreDb, STUDENTS_COLLECTION, studentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StudentProfile;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore Service] Perfil não localizado na nuvem:', error);
    return null;
  }
}

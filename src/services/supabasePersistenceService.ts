import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { AttendanceRecord, WorkshopEvaluation, StudentProfile, Workshop, PushNotificationItem } from '../types';

/**
 * Service to handle direct persistence and queries with Supabase PostgreSQL.
 * If Supabase is not configured, operations safely return null or false.
 */

export interface SupabaseSyncResult {
  success: boolean;
  insertedCount: number;
  message?: string;
  error?: string;
}

/**
 * Fetches attendance records for a specific student from Supabase
 */
export async function fetchStudentAttendanceFromSupabase(
  studentId: string
): Promise<AttendanceRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('attendance')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      console.warn('[Supabase Service] Erro ao buscar presenças:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((row: any): AttendanceRecord => ({
      id: row.id,
      workshopId: row.workshop_id,
      workshopTitle: row.workshop_title,
      date: row.date,
      time: row.time,
      hours: Number(row.hours) || 2,
      status: row.status,
      checkInMethod: row.check_in_method,
      checkInTime: row.check_in_time,
      location: row.location || 'Polo SASP / Remoto',
      isSimultaneous: Boolean(row.is_simultaneous),
      simultaneousGroupId: row.simultaneous_group_id || undefined,
    }));
  } catch (err: any) {
    console.warn('[Supabase Service] Exceção ao consultar presenças:', err?.message || err);
    return null;
  }
}

/**
 * Persists a single attendance record into Supabase
 */
export async function persistAttendanceRecordToSupabase(
  studentId: string,
  record: AttendanceRecord
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: `${studentId}_${record.workshopId}`,
      workshop_id: record.workshopId,
      workshop_title: record.workshopTitle,
      student_id: studentId,
      date: record.date,
      time: record.time,
      hours: record.hours,
      status: record.status,
      check_in_method: record.checkInMethod || 'manual',
      check_in_time: record.checkInTime || '',
      location: record.location,
      is_simultaneous: Boolean(record.isSimultaneous),
      simultaneous_group_id: record.simultaneousGroupId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('attendance')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Service] Erro ao gravar presença:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('[Supabase Service] Exceção ao persistir presença:', err?.message || err);
    return false;
  }
}

/**
 * Batch persists attendance records to Supabase
 */
export async function batchPersistAttendanceToSupabase(
  studentId: string,
  records: AttendanceRecord[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payloads = records.map((record) => ({
      id: `${studentId}_${record.workshopId}`,
      workshop_id: record.workshopId,
      workshop_title: record.workshopTitle,
      student_id: studentId,
      date: record.date,
      time: record.time,
      hours: record.hours,
      status: record.status,
      check_in_method: record.checkInMethod || 'manual',
      check_in_time: record.checkInTime || '',
      location: record.location,
      is_simultaneous: Boolean(record.isSimultaneous),
      simultaneous_group_id: record.simultaneousGroupId || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('attendance')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Service] Erro no lote de presenças:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('[Supabase Service] Exceção no lote de presenças:', err?.message || err);
    return false;
  }
}

/**
 * Fetches student profile from Supabase
 */
export async function fetchStudentProfileFromSupabase(
  studentId: string
): Promise<StudentProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      matricula: data.matricula,
      courseName: data.course_name,
      turma: data.turma,
      institution: data.institution,
      avatarUrl: data.avatar_url,
      facialEnrolled: Boolean(data.facial_enrolled),
      facialConfidence: data.facial_confidence ? Number(data.facial_confidence) : undefined,
      lastLogin: data.last_login || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Persists student profile in Supabase
 */
export async function persistStudentProfileToSupabase(
  student: StudentProfile
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: student.id,
      name: student.name,
      email: student.email,
      cpf: student.cpf,
      matricula: student.matricula,
      course_name: student.courseName,
      turma: student.turma,
      institution: student.institution,
      avatar_url: student.avatarUrl,
      facial_enrolled: student.facialEnrolled,
      facial_confidence: student.facialConfidence || null,
      last_login: student.lastLogin || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('students')
      .upsert(payload, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches workshop evaluations from Supabase
 */
export async function fetchStudentEvaluationsFromSupabase(
  studentId: string
): Promise<Record<string, WorkshopEvaluation>> {
  const client = getSupabaseClient();
  if (!client) return {};

  try {
    const { data, error } = await client
      .from('workshop_evaluations')
      .select('*')
      .eq('student_id', studentId);

    if (error || !data) return {};

    const map: Record<string, WorkshopEvaluation> = {};
    data.forEach((row: any) => {
      map[row.workshop_id] = {
        workshopId: row.workshop_id,
        studentId: row.student_id,
        rating: Number(row.rating) || 5,
        speakerRating: Number(row.speaker_rating) || 5,
        contentApplicability: Number(row.content_applicability) || 5,
        feedback: row.feedback || '',
        submittedAt: row.submitted_at || row.created_at || '',
      };
    });

    return map;
  } catch {
    return {};
  }
}

/**
 * Persists a workshop evaluation to Supabase
 */
export async function persistWorkshopEvaluationToSupabase(
  studentId: string,
  workshopId: string,
  evaluation: WorkshopEvaluation,
  workshopTitle?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: `${workshopId}_${studentId}`,
      workshop_id: workshopId,
      workshop_title: workshopTitle || '',
      student_id: studentId,
      rating: evaluation.rating,
      speaker_rating: evaluation.speakerRating,
      content_applicability: evaluation.contentApplicability,
      feedback: evaluation.feedback,
      submitted_at: evaluation.submittedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('workshop_evaluations')
      .upsert(payload, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Subscribes to realtime updates on student attendance in Supabase
 */
export function subscribeToSupabaseAttendance(
  studentId: string,
  onUpdate: (records: AttendanceRecord[]) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel(`public:attendance:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${studentId}`,
        },
        async () => {
          // Re-fetch full attendance on any change
          const updated = await fetchStudentAttendanceFromSupabase(studentId);
          if (updated) onUpdate(updated);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Falha ao assinar canal:', err);
    return null;
  }
}

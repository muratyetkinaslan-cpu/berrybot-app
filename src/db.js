

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://byjxolgvqetwoxhcaemv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hCkrcWh7auiz-tdqEfUp5Q_xgOWOMYz"
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══ USERS ═══
export async function loginUser(email, password) {
  const { data, error } = await supabase.from('bb_users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return null;
  const user = { ...data, instructorId: data.instructor_id, classId: data.class_id };
  if (user.role === 'student') {
    await supabase.from('bb_student_meta').update({ online: true, last_seen: Date.now() }).eq('student_id', user.id);
  }
  addLog({ type: 'login', userId: user.id, detail: `${user.name} giriş yaptı` });
  return user;
}

export async function getUsers() {
  const { data } = await supabase.from('bb_users').select('*').order('created_at');
  return (data || []).map(u => ({ ...u, instructorId: u.instructor_id, classId: u.class_id }));
}

export async function createUser(userData) {
  const id = `${userData.role}_${Date.now()}`;
  const { data, error } = await supabase.from('bb_users').insert({
    id, name: userData.name, email: userData.email, password: userData.password,
    role: userData.role, instructor_id: userData.instructorId || null,
    grup: userData.grup || 'Büyük',
  }).select().single();
  if (error) { console.error('createUser:', error); return null; }
  if (userData.role === 'student') {
    const rows = [];
    for (let i = 1; i <= 36; i++) rows.push({ student_id: id, task_id: i, status: i === 1 ? 'active' : 'locked' });
    await supabase.from('bb_progress').insert(rows);
    await supabase.from('bb_student_meta').insert({ student_id: id, online: false, last_seen: 0 });
  }
  return data;
}

// ═══ PROGRESS ═══

const PROGRESS_COLS = 'student_id,task_id,status,started_at,completed_at,approved_at,instructor_note,photo';

// Fetch ALL progress with pagination
export async function getAllProgress() {
  const map = {};
  let from = 0;
  const PAGE = 1000;
  let total = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('bb_progress')
      .select(PROGRESS_COLS)
      .range(from, from + PAGE - 1);
    
    if (error) { console.error('🔴 getAllProgress error:', error.message); break; }
    if (!data || data.length === 0) break;
    
    data.forEach(r => {
      if (!map[r.student_id]) map[r.student_id] = {};
      map[r.student_id][r.task_id] = {
        status: r.status, startedAt: r.started_at, completedAt: r.completed_at,
        approvedAt: r.approved_at, instructorNote: r.instructor_note, photo: r.photo,
      };
    });
    
    total += data.length;
    if (data.length < PAGE) break;
    from += PAGE;
  }
  
  console.log('📦 getAllProgress:', total, 'rows');
  return map;
}

// Fetch ONLY one student's progress
export async function getStudentProgress(studentId) {
  const { data, error } = await supabase
    .from('bb_progress')
    .select(PROGRESS_COLS)
    .eq('student_id', studentId);
  
  if (error) { console.error('🔴 getStudentProgress error:', error.message); return {}; }
  
  const map = {};
  (data || []).forEach(r => {
    map[r.task_id] = {
      status: r.status, startedAt: r.started_at, completedAt: r.completed_at,
      approvedAt: r.approved_at, instructorNote: r.instructor_note, photo: r.photo,
    };
  });
  return map;
}

// Simple update — small payload only
async function updateStatus(studentId, taskId, fields) {
  console.log('🔵 DB.updateStatus CALLED:', { studentId, taskId, fields });
  const { data, error, count } = await supabase.from('bb_progress')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('student_id', studentId).eq('task_id', taskId)
    .select();
  if (error) {
    console.error('🔴 DB.updateStatus FAILED:', error.message, error.details, error.hint);
    return false;
  }
  console.log('🟢 DB.updateStatus OK:', { matched: data?.length, data });
  if (!data || data.length === 0) {
    console.error('🔴 DB.updateStatus: NO ROWS MATCHED! student_id=', studentId, 'task_id=', taskId);
    return false;
  }
  return true;
}

// ═══ TASK ACTIONS ═══
export async function startTask(studentId, taskId) {
  console.log('🚀 startTask:', { studentId, taskId });
  const ok = await updateStatus(studentId, taskId, { status: 'in_progress', started_at: Date.now() });
  console.log('🚀 startTask result:', ok);
  if (ok) addLog({ type: 'task_started', userId: studentId, taskId, detail: `Görev ${taskId} başladı` });
  return ok;
}

export async function submitTask(studentId, taskId, hasPhoto) {
  console.log('📤 submitTask:', { studentId, taskId, hasPhoto });
  const ok = await updateStatus(studentId, taskId, { status: 'pending_review', completed_at: Date.now(), photo: hasPhoto ? 'local' : null });
  console.log('📤 submitTask result:', ok);
  if (!ok) return false;
  addLog({ type: 'task_completed', userId: studentId, taskId, detail: 'Fotoğraf yüklendi, onaya gönderildi' });
  return true;
}

export async function approveTask(instructorId, studentId, taskId, note) {
  await updateStatus(studentId, taskId, { status: 'approved', approved_at: Date.now(), instructor_note: note || 'Onaylandı ✓' });
  // Unlock next task — force active regardless of current status
  const nextId = taskId + 1;
  if (nextId <= 36) {
    // First try update (task row should exist from seed)
    const { data } = await supabase.from('bb_progress')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('student_id', studentId).eq('task_id', nextId)
      .neq('status', 'approved') // don't overwrite already approved
      .neq('status', 'in_progress') // don't overwrite in progress
      .neq('status', 'pending_review') // don't overwrite pending
      .select();
    // If no row was updated (row might not exist), insert it
    if (!data || data.length === 0) {
      await supabase.from('bb_progress')
        .upsert({ student_id: studentId, task_id: nextId, status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'student_id,task_id' })
        .then(({ error }) => { if (error) console.warn('unlock next:', error.message); });
    }
    console.log('🔓 Unlocked task', nextId, 'for', studentId, 'result:', data?.length);
  }
  addLog({ type: 'task_approved', userId: instructorId, targetUser: studentId, taskId, detail: `Görev ${taskId} onaylandı` });
}

export async function rejectTask(instructorId, studentId, taskId, note) {
  await updateStatus(studentId, taskId, { status: 'rejected', instructor_note: note || 'Tekrar dene' });
  addLog({ type: 'task_rejected', userId: instructorId, targetUser: studentId, taskId, detail: note || 'Reddedildi' });
}

export async function resubmitTask(studentId, taskId) {
  await updateStatus(studentId, taskId, { status: 'in_progress', started_at: Date.now(), completed_at: null, instructor_note: null });
  addLog({ type: 'task_resubmit', userId: studentId, taskId, detail: 'Tekrar başlatıldı' });
}

// ═══ META ═══
export async function getAllMeta() {
  const { data } = await supabase.from('bb_student_meta').select('*');
  const map = {};
  (data || []).forEach(r => { map[r.student_id] = r; });
  return map;
}

export async function requestHelp(studentId) {
  await supabase.from('bb_student_meta').update({ help_request: Date.now() }).eq('student_id', studentId);
  addLog({ type: 'help_request', userId: studentId, detail: 'Eğitmen çağırdı' });
}

export async function clearHelp(studentId) {
  await supabase.from('bb_student_meta').update({ help_request: null }).eq('student_id', studentId);
}

export async function setOnline(studentId, online) {
  await supabase.from('bb_student_meta').update({ online, last_seen: Date.now() }).eq('student_id', studentId);
}

// ═══ LOGS ═══
export async function addLog({ type, userId, targetUser, taskId, detail }) {
  await supabase.from('bb_logs').insert({
    type, user_id: userId || null, target_user: targetUser || null,
    task_id: taskId || null, detail: detail || '', ts: Date.now(),
  }).then(({ error }) => { if (error) console.warn('log:', error.message); });
}

export async function getLogs(limit = 100) {
  const { data } = await supabase.from('bb_logs').select('*').order('ts', { ascending: false }).limit(limit);
  return (data || []).map(l => ({ id: l.id, type: l.type, userId: l.user_id, targetUser: l.target_user, taskId: l.task_id, detail: l.detail, ts: l.ts }));
}

// ═══ LAYOUTS ═══
export async function getClassLayouts() {
  const { data } = await supabase.from('bb_class_layouts').select('*');
  return (data || []).map(c => ({
    id: c.id, name: c.name, instructorId: c.instructor_id, canvasH: c.canvas_h || 700,
    ...(typeof c.layout_json === 'string' ? JSON.parse(c.layout_json) : c.layout_json),
  }));
}

export async function saveClassLayout(classId, layoutData) {
  const { tables, objects, canvasH, ...rest } = layoutData;
  await supabase.from('bb_class_layouts').upsert({
    id: classId, name: rest.name || classId, instructor_id: rest.instructorId || null,
    canvas_h: canvasH || 700, layout_json: JSON.stringify({ tables: tables || [], objects: objects || [] }),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
}

export async function saveAllLayouts(layouts) {
  for (const l of layouts) await saveClassLayout(l.id, l);
}

// ═══ REALTIME ═══
export function subscribeToAll(onUpdate) {
  const channels = [];
  ['bb_progress', 'bb_student_meta', 'bb_logs'].forEach(table => {
    channels.push(supabase.channel(`${table}_ch`).on('postgres_changes', { event: '*', schema: 'public', table }, () => onUpdate(table)).subscribe());
  });
  return () => channels.forEach(ch => supabase.removeChannel(ch));
}
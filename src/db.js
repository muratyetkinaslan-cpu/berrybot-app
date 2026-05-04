import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://byjxolgvqetwoxhcaemv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hCkrcWh7auiz-tdqEfUp5Q_xgOWOMYz"
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══ USERS ═══
export async function loginUser(email, password) {
  const { data, error } = await supabase.from('bb_users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return null;
  const user = { ...data, instructorId: data.instructor_id, classId: data.class_id, childId: data.child_id };
  if (user.role === 'student') {
    await supabase.from('bb_student_meta').update({ online: true, last_seen: Date.now() }).eq('student_id', user.id);
  }
  addLog({ type: 'login', userId: user.id, detail: `${user.name} giriş yaptı` });
  return user;
}

export async function getUsers() {
  const { data } = await supabase.from('bb_users').select('*').order('created_at');
  return (data || []).map(u => ({ ...u, instructorId: u.instructor_id, classId: u.class_id, childId: u.child_id }));
}

export async function createUser(userData) {
  const id = `${userData.role}_${Date.now()}`;
  const { data, error } = await supabase.from('bb_users').insert({
    id, name: userData.name, email: userData.email, password: userData.password,
    role: userData.role, instructor_id: userData.instructorId || null,
    child_id: userData.childId || null,
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

// Track current page student is on
export async function setCurrentPage(studentId, page, taskId) {
  await supabase.from('bb_student_meta').update({ 
    current_page: page, 
    current_task_id: taskId || null,
    page_updated_at: Date.now(),
    last_seen: Date.now(),
    online: true,
  }).eq('student_id', studentId);
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

// ═══ ADMIN: SET STUDENT PROGRESS ═══
// Sets tasks 1..(fromTask-1) as approved, fromTask as active, rest as locked
export async function setStudentProgressTo(studentId, fromTask) {
  const now = Date.now();
  const ts = new Date().toISOString();
  
  // 1. Set all tasks before fromTask as approved
  if (fromTask > 1) {
    await supabase.from('bb_progress')
      .update({ status: 'approved', started_at: now - 300000, completed_at: now - 60000, approved_at: now, updated_at: ts })
      .eq('student_id', studentId)
      .gte('task_id', 1).lte('task_id', fromTask - 1);
  }
  
  // 2. Set fromTask as active
  await supabase.from('bb_progress')
    .update({ status: 'active', started_at: null, completed_at: null, approved_at: null, instructor_note: null, photo: null, updated_at: ts })
    .eq('student_id', studentId).eq('task_id', fromTask);
  
  // 3. Set all tasks after fromTask as locked
  if (fromTask < 36) {
    await supabase.from('bb_progress')
      .update({ status: 'locked', started_at: null, completed_at: null, approved_at: null, instructor_note: null, photo: null, updated_at: ts })
      .eq('student_id', studentId)
      .gte('task_id', fromTask + 1).lte('task_id', 36);
  }
  
  addLog({ type: 'admin_set_progress', userId: studentId, taskId: fromTask, detail: `Admin: Görev ${fromTask}'den devam ayarlandı (${fromTask-1} görev onaylandı)` });
  console.log('🔧 setStudentProgressTo:', studentId, 'from task', fromTask);
}

// ═══ REALTIME ═══
export function subscribeToAll(onUpdate) {
  const channels = [];
  ['bb_progress', 'bb_student_meta', 'bb_logs'].forEach(table => {
    channels.push(supabase.channel(`${table}_ch`).on('postgres_changes', { event: '*', schema: 'public', table }, () => onUpdate(table)).subscribe());
  });
  return () => channels.forEach(ch => supabase.removeChannel(ch));
}

// ═══════════════════════════════════════════════════════════════
// PRACTICE PROGRESS CRUD
// ═══════════════════════════════════════════════════════════════
export async function fetchPracticeProgress(studentId) {
  const { data, error } = await supabase.from('bb_practice_progress')
    .select('*').eq('student_id', studentId);
  if (error) { console.error('fetchPractice', error); return []; }
  return data || [];
}

export async function recordPracticeAttempt({ studentId, questionId, category, topic, isCorrect, xp = 5 }) {
  const now = Date.now();
  const { data: existing } = await supabase.from('bb_practice_progress')
    .select('*').eq('student_id', studentId).eq('question_id', questionId).maybeSingle();

  if (existing) {
    const update = {
      attempts: existing.attempts + 1,
      last_attempt_at: now,
    };
    if (isCorrect) {
      update.correct = existing.correct + 1;
      if (!existing.first_correct_at) {
        update.first_correct_at = now;
        update.xp_earned = (existing.xp_earned || 0) + xp;
      }
    }
    await supabase.from('bb_practice_progress')
      .update(update).eq('id', existing.id);
  } else {
    await supabase.from('bb_practice_progress').insert({
      student_id: studentId,
      question_id: questionId,
      category, topic,
      attempts: 1,
      correct: isCorrect ? 1 : 0,
      last_attempt_at: now,
      first_correct_at: isCorrect ? now : null,
      xp_earned: isCorrect ? xp : 0,
    });
  }
  addLog({ type: 'practice_attempt', userId: studentId, taskId: questionId, detail: `${topic}: ${isCorrect?'✓':'✗'}` });
}

// ═══════════════════════════════════════════════════════════════
// HOMEWORK CRUD
// ═══════════════════════════════════════════════════════════════
export async function fetchHomework() {
  const { data, error } = await supabase.from('bb_homework')
    .select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) { console.error('fetchHomework', error); return []; }
  return data || [];
}

export async function createHomework({ instructorId, title, description, dueAt, xp, targetType, targetValue }) {
  const { data, error } = await supabase.from('bb_homework').insert({
    instructor_id: instructorId,
    title, description,
    due_at: dueAt,
    xp: xp || 50,
    target_type: targetType || 'all',
    target_value: targetValue || null,
    created_at: Date.now(),
    active: true,
  }).select().single();
  if (error) { console.error('createHomework', error); return null; }
  addLog({ type: 'homework_created', userId: instructorId, detail: `Ödev oluşturuldu: ${title}` });
  return data;
}

export async function deleteHomework(id, instructorId) {
  await supabase.from('bb_homework').update({ active: false }).eq('id', id);
  addLog({ type: 'homework_deleted', userId: instructorId, detail: `Ödev silindi: #${id}` });
}

export async function fetchHomeworkSubmissions(homeworkId) {
  const q = homeworkId
    ? supabase.from('bb_homework_submission').select('*').eq('homework_id', homeworkId)
    : supabase.from('bb_homework_submission').select('*');
  const { data, error } = await q;
  if (error) { console.error('fetchSubmissions', error); return []; }
  return data || [];
}

export async function submitHomework({ homeworkId, studentId, photoFlag, note }) {
  const now = Date.now();
  const { data: existing } = await supabase.from('bb_homework_submission')
    .select('*').eq('homework_id', homeworkId).eq('student_id', studentId).maybeSingle();
  if (existing) {
    await supabase.from('bb_homework_submission').update({
      status: 'pending',
      photo: photoFlag,
      note: note || null,
      submitted_at: now,
      reviewed_at: null,
      instructor_note: null,
    }).eq('id', existing.id);
  } else {
    await supabase.from('bb_homework_submission').insert({
      homework_id: homeworkId,
      student_id: studentId,
      status: 'pending',
      photo: photoFlag,
      note: note || null,
      submitted_at: now,
    });
  }
  addLog({ type: 'homework_submitted', userId: studentId, detail: `Ödev gönderildi: #${homeworkId}` });
}

export async function reviewHomework({ submissionId, status, instructorNote, instructorId }) {
  await supabase.from('bb_homework_submission').update({
    status,
    instructor_note: instructorNote || null,
    reviewed_at: Date.now(),
  }).eq('id', submissionId);
  addLog({ type: 'homework_reviewed', userId: instructorId, detail: `${status}: #${submissionId}` });
}

// ═══════════════════════════════════════════════════════════════
// ANSWER UNLOCK
// ═══════════════════════════════════════════════════════════════
export async function fetchAnswerUnlocks(studentId) {
  const q = studentId
    ? supabase.from('bb_answer_unlock').select('*').eq('student_id', studentId)
    : supabase.from('bb_answer_unlock').select('*');
  const { data, error } = await q;
  if (error) { console.error('fetchAnswerUnlocks', error); return []; }
  return data || [];
}

export async function unlockAnswer({ studentId, taskId, instructorId }) {
  const { data: existing } = await supabase.from('bb_answer_unlock')
    .select('id').eq('student_id', studentId).eq('task_id', taskId).maybeSingle();
  if (existing) return; // already unlocked
  await supabase.from('bb_answer_unlock').insert({
    student_id: studentId,
    task_id: taskId,
    unlocked_by: instructorId,
    unlocked_at: Date.now(),
  });
  addLog({ type: 'answer_unlocked', userId: instructorId, targetUser: studentId, taskId, detail: `Görev ${taskId} cevap anahtarı açıldı` });
}

export async function lockAnswer({ studentId, taskId, instructorId }) {
  await supabase.from('bb_answer_unlock').delete()
    .eq('student_id', studentId).eq('task_id', taskId);
  addLog({ type: 'answer_locked', userId: instructorId, targetUser: studentId, taskId, detail: `Görev ${taskId} cevap anahtarı kilitlendi` });
}


// ═══════════════════════════════════════════════════════════════
// KIT SYSTEM
// ═══════════════════════════════════════════════════════════════
export async function setUserKit(userId, kit) {
  await supabase.from('bb_users').update({ kit }).eq('id', userId);
  addLog({ type: 'kit_changed', userId, detail: `Kit: ${kit}` });
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM TASKS — admin yönetir
// ═══════════════════════════════════════════════════════════════
export async function fetchCustomTasks(kit) {
  const q = kit
    ? supabase.from('bb_tasks').select('*').eq('kit', kit).eq('active', true).order('task_id')
    : supabase.from('bb_tasks').select('*').eq('active', true).order('task_id');
  const { data, error } = await q;
  if (error) { console.error('fetchCustomTasks', error); return []; }
  return data || [];
}

export async function upsertTask(t) {
  const now = Date.now();
  const { data: existing } = await supabase.from('bb_tasks')
    .select('id').eq('kit', t.kit).eq('task_id', t.task_id).maybeSingle();
  const payload = {
    title: t.title, category: t.category, difficulty: t.difficulty,
    expected_min: t.expected_min, xp: t.xp, emoji: t.emoji,
    description: t.description, answer: t.answer,
    learnings: t.learnings || [],
    image_url: t.image_url, video_url: t.video_url, answer_image_url: t.answer_image_url,
    position: t.position, updated_at: now,
  };
  if (existing) {
    const { error } = await supabase.from('bb_tasks').update(payload).eq('id', existing.id);
    if (error) console.error('upsertTask update', error);
    addLog({ type: 'task_updated', detail: `${t.kit} #${t.task_id}` });
    return existing.id;
  } else {
    const { data, error } = await supabase.from('bb_tasks').insert({
      ...payload, kit: t.kit, task_id: t.task_id, created_at: now,
    }).select().single();
    if (error) { console.error('upsertTask insert', error); return null; }
    addLog({ type: 'task_created', detail: `${t.kit} #${t.task_id}: ${t.title}` });
    return data.id;
  }
}

export async function deleteTask(id) {
  await supabase.from('bb_tasks').update({ active: false }).eq('id', id);
}

// ═══════════════════════════════════════════════════════════════
// MEDIA UPLOAD — Supabase Storage
// ═══════════════════════════════════════════════════════════════
export async function uploadTaskMedia({ kit, taskId, type, file }) {
  // type: "image" | "video" | "answer"
  const ext = file.name.split('.').pop();
  const path = `${kit}/${taskId}/${type}.${ext}`;
  const { error } = await supabase.storage.from('task-media').upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) { console.error('upload', error); throw error; }
  const { data } = supabase.storage.from('task-media').getPublicUrl(path);
  return data.publicUrl;
}
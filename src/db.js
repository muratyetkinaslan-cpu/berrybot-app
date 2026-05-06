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
  const kit = userData.kit || 'berrybot';
  const isStudent = userData.role === 'student';
  const { data, error } = await supabase.from('bb_users').insert({
    id, name: userData.name, email: userData.email, password: userData.password,
    role: userData.role, instructor_id: userData.instructorId || null,
    child_id: userData.childId || null,
    grup: userData.grup || 'Büyük',
    kit: isStudent ? kit : null,
    kits: isStudent ? [kit] : [],  // multi-kit array starts with primary
  }).select().single();
  if (error) { console.error('createUser:', error); return null; }
  if (userData.role === 'student') {
    // Only seed initial 36 progress rows for BerryBot — others start with no tasks
    if (kit === 'berrybot') {
      const rows = [];
      for (let i = 1; i <= 36; i++) rows.push({ student_id: id, task_id: i, status: i === 1 ? 'active' : 'locked', kit });
      await supabase.from('bb_progress').insert(rows);
    }
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

  // Determine the student's kit
  const { data: studentRow } = await supabase.from('bb_users')
    .select('kit').eq('id', studentId).maybeSingle();
  const kit = studentRow?.kit || 'berrybot';

  // Find the next task_id for this kit (next higher than current, in active tasks)
  let nextId = null;
  if (kit === 'berrybot') {
    // Hardcoded 36-task curriculum
    if (taskId + 1 <= 36) nextId = taskId + 1;
  } else {
    // Tank/PicoBricks: look up next task_id from bb_tasks
    const { data: nextTask } = await supabase.from('bb_tasks')
      .select('task_id').eq('kit', kit).eq('active', true)
      .gt('task_id', taskId).order('task_id').limit(1).maybeSingle();
    if (nextTask) nextId = nextTask.task_id;
  }

  if (nextId !== null) {
    // First try update (task row should exist from seed)
    const { data } = await supabase.from('bb_progress')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('student_id', studentId).eq('task_id', nextId)
      .neq('status', 'approved').neq('status', 'in_progress').neq('status', 'pending_review')
      .select();
    if (!data || data.length === 0) {
      await supabase.from('bb_progress')
        .upsert({ student_id: studentId, task_id: nextId, status: 'active', kit, updated_at: new Date().toISOString() }, { onConflict: 'student_id,task_id' })
        .then(({ error }) => { if (error) console.warn('unlock next:', error.message); });
    }
    console.log('🔓 Unlocked task', nextId, 'for', studentId, 'kit', kit);
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
  ['bb_progress', 'bb_student_meta', 'bb_logs', 'bb_tasks'].forEach(table => {
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
// HOMEWORK v2 — Template + Assignment system
// ═══════════════════════════════════════════════════════════════

// ─── Templates (admin manages) ───
export async function fetchHomeworkTemplates() {
  const { data, error } = await supabase.from('bb_homework_templates')
    .select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) { console.error('fetchHomeworkTemplates', error); return []; }
  return data || [];
}

export async function upsertHomeworkTemplate(t) {
  if (!t || !t.title?.trim() || !t.kit) {
    throw new Error("Eksik alan: title ve kit zorunlu");
  }
  const now = Date.now();
  const payload = {
    kit: t.kit,
    title: String(t.title || "").trim(),
    category: String(t.category || "Genel").trim(),
    description: t.description || "",
    difficulty: parseInt(t.difficulty) || 1,
    expected_min: parseInt(t.expected_min) || 30,
    emoji: t.emoji || "📝",
    image_url: t.image_url || null,
    video_url: t.video_url || null,
    answer_image_url: t.answer_image_url || null,
    active: true,
    updated_at: now,
  };
  if (t.id) {
    const { error } = await supabase.from('bb_homework_templates').update(payload).eq('id', t.id);
    if (error) throw new Error("Güncelleme hatası: " + (error.message || ""));
    addLog({ type: 'hw_template_updated', detail: `Şablon #${t.id} güncellendi` });
    return t.id;
  } else {
    const { data, error } = await supabase.from('bb_homework_templates')
      .insert({ ...payload, created_at: now }).select().single();
    if (error) throw new Error("Ekleme hatası: " + (error.message || ""));
    addLog({ type: 'hw_template_created', detail: `Şablon "${t.title}" oluşturuldu` });
    return data.id;
  }
}

export async function deleteHomeworkTemplate(id) {
  await supabase.from('bb_homework_templates').update({ active: false }).eq('id', id);
  addLog({ type: 'hw_template_deleted', detail: `Şablon #${id} silindi` });
}

export async function uploadHomeworkMedia({ templateId, type, file }) {
  // type: image, video, answer
  const ext = file.name.split('.').pop();
  const path = `homework/${templateId || 'new'}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('task-media')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  const { data } = supabase.storage.from('task-media').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Assignments (instructor → student) ───
export async function fetchAssignments(filter = {}) {
  let q = supabase.from('bb_homework_assignment').select('*');
  if (filter.studentId) q = q.eq('student_id', filter.studentId);
  if (filter.instructorId) q = q.eq('instructor_id', filter.instructorId);
  const { data, error } = await q.order('assigned_at', { ascending: false });
  if (error) { console.error('fetchAssignments', error); return []; }
  return data || [];
}

export async function assignHomework({ templateId, studentIds, instructorId, dueDate }) {
  if (!templateId || !Array.isArray(studentIds) || studentIds.length === 0 || !dueDate) {
    throw new Error("Eksik alan: şablon, en az 1 öğrenci ve bitiş tarihi gerekli");
  }
  const now = Date.now();
  const rows = studentIds.map(sid => ({
    template_id: templateId,
    student_id: sid,
    instructor_id: instructorId,
    due_date: dueDate,
    assigned_at: now,
    status: 'assigned',
  }));
  // upsert ignores duplicates (same template+student already assigned)
  const { error } = await supabase.from('bb_homework_assignment')
    .upsert(rows, { onConflict: 'template_id,student_id', ignoreDuplicates: true });
  if (error) throw new Error("Atama hatası: " + (error.message || ""));
  addLog({ type: 'hw_assigned', userId: instructorId, detail: `Ödev ${studentIds.length} öğrenciye atandı` });
  return { count: studentIds.length };
}

export async function submitHomeworkV2({ assignmentId, photoUrl, text, studentId }) {
  const now = Date.now();
  const payload = {
    submission_photo_url: photoUrl || null,
    submission_text: text || null,
    submitted_at: now,
    status: 'submitted',
  };
  const { error } = await supabase.from('bb_homework_assignment')
    .update(payload).eq('id', assignmentId);
  if (error) throw new Error("Teslim hatası: " + (error.message || ""));
  addLog({ type: 'hw_v2_submitted', userId: studentId, detail: `Ödev #${assignmentId} teslim edildi` });
}

export async function reviewHomeworkV2({ assignmentId, status, instructorNote, instructorId }) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error("Geçersiz durum");
  }
  await supabase.from('bb_homework_assignment').update({
    status,
    instructor_note: instructorNote || null,
    reviewed_at: Date.now(),
  }).eq('id', assignmentId);
  addLog({ type: 'hw_v2_reviewed', userId: instructorId, detail: `${status}: assignment #${assignmentId}` });
}

export async function unlockHomeworkAnswer({ assignmentId, instructorId }) {
  await supabase.from('bb_homework_assignment').update({
    answer_unlocked: true,
    answer_unlocked_at: Date.now(),
  }).eq('id', assignmentId);
  addLog({ type: 'hw_answer_unlocked', userId: instructorId, detail: `Cevap anahtarı açıldı: assignment #${assignmentId}` });
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
  // Update user's kit
  await supabase.from('bb_users').update({ kit }).eq('id', userId);
  addLog({ type: 'kit_changed', userId, detail: `Kit: ${kit}` });

  // Reset progress: delete old + seed new based on new kit's tasks
  await supabase.from('bb_progress').delete().eq('student_id', userId);

  if (kit === 'berrybot') {
    // BerryBot: seed all 36 hardcoded tasks (1=active, 2-36=locked)
    const rows = [];
    for (let i = 1; i <= 36; i++) {
      rows.push({ student_id: userId, task_id: i, status: i === 1 ? 'active' : 'locked', kit });
    }
    await supabase.from('bb_progress').insert(rows);
  } else {
    // Tank/PicoBricks: seed from existing bb_tasks for this kit
    const { data: kitTasks } = await supabase.from('bb_tasks')
      .select('task_id').eq('kit', kit).eq('active', true).order('task_id');
    if (kitTasks && kitTasks.length > 0) {
      const rows = kitTasks.map((t, i) => ({
        student_id: userId, task_id: t.task_id, status: i === 0 ? 'active' : 'locked', kit,
      }));
      await supabase.from('bb_progress').insert(rows);
    }
    // No tasks yet → empty, MissionBoard shows "Henüz görev yok"
  }
}

// ═══════════════════════════════════════════════════════════════
// MULTI-KIT SUPPORT — Öğrenci birden çok kite kayıtlı olabilir
// ═══════════════════════════════════════════════════════════════

// Add a kit to a student's enrolled kit list (additive — does not remove others)
export async function addKitToUser(userId, kitToAdd) {
  console.log('🎒 addKitToUser:', userId, kitToAdd);

  // Read current kits + primary kit
  const { data: user } = await supabase.from('bb_users')
    .select('kit, kits, name').eq('id', userId).single();
  if (!user) throw new Error("Kullanıcı bulunamadı");

  const currentKits = Array.isArray(user.kits) ? user.kits : [];
  if (currentKits.includes(kitToAdd)) {
    console.log('🎒 Kit already enrolled — skipping');
    return { added: false, reason: 'already-enrolled' };
  }

  const newKits = [...currentKits, kitToAdd];
  // If primary kit is null, set this as primary
  const newPrimary = user.kit || kitToAdd;

  // Update user record
  const { error: upErr } = await supabase.from('bb_users')
    .update({ kits: newKits, kit: newPrimary })
    .eq('id', userId);
  if (upErr) throw new Error("Kayıt güncellenemedi: " + upErr.message);

  // Seed progress rows for this new kit (without disturbing other kits' progress)
  if (kitToAdd === 'berrybot') {
    // Only insert if no berrybot rows exist
    const { data: existing } = await supabase.from('bb_progress')
      .select('task_id').eq('student_id', userId).eq('kit', 'berrybot').limit(1);
    if (!existing || existing.length === 0) {
      const rows = [];
      for (let i = 1; i <= 36; i++) {
        rows.push({ student_id: userId, task_id: i, status: i === 1 ? 'active' : 'locked', kit: 'berrybot' });
      }
      await supabase.from('bb_progress').upsert(rows, { onConflict: 'student_id,task_id', ignoreDuplicates: true });
    }
  } else {
    const { data: kitTasks } = await supabase.from('bb_tasks')
      .select('task_id').eq('kit', kitToAdd).eq('active', true);
    if (kitTasks && kitTasks.length > 0) {
      const ids = kitTasks.map(x => parseInt(x.task_id)).sort((a, b) => a - b);
      const rows = ids.map((tid, i) => ({
        student_id: userId, task_id: tid, status: i === 0 ? 'active' : 'locked', kit: kitToAdd,
      }));
      await supabase.from('bb_progress').upsert(rows, { onConflict: 'student_id,task_id', ignoreDuplicates: true });
    }
  }

  addLog({ type: 'kit_added', userId, detail: `${user.name} → +${kitToAdd}` });
  return { added: true, newKits };
}

// Remove a kit from a student's enrolled list (does NOT delete progress rows)
export async function removeKitFromUser(userId, kitToRemove) {
  console.log('🎒 removeKitFromUser:', userId, kitToRemove);

  const { data: user } = await supabase.from('bb_users')
    .select('kit, kits, name').eq('id', userId).single();
  if (!user) throw new Error("Kullanıcı bulunamadı");

  const currentKits = Array.isArray(user.kits) ? user.kits : [];
  const newKits = currentKits.filter(k => k !== kitToRemove);

  // If removing the primary kit, switch primary to first remaining
  let newPrimary = user.kit;
  if (user.kit === kitToRemove) {
    newPrimary = newKits[0] || null;
  }

  await supabase.from('bb_users')
    .update({ kits: newKits, kit: newPrimary })
    .eq('id', userId);

  // Optional: also delete progress for that kit (uncomment if needed)
  // await supabase.from('bb_progress').delete().eq('student_id', userId).eq('kit', kitToRemove);

  addLog({ type: 'kit_removed', userId, detail: `${user.name} → -${kitToRemove}` });
  return { newKits };
}

// Set primary kit (which one student logs into by default)
export async function setPrimaryKit(userId, kit) {
  await supabase.from('bb_users').update({ kit }).eq('id', userId);
  addLog({ type: 'primary_kit_changed', userId, detail: `Primary: ${kit}` });
}


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
  if (!t || !t.kit || !t.task_id || !t.title || !t.category) {
    console.error('upsertTask: missing required fields', { kit: t?.kit, task_id: t?.task_id, title: t?.title, category: t?.category });
    throw new Error("Eksik alan: kit, task_id, title, category zorunlu");
  }
  const now = Date.now();
  console.log('💾 upsertTask START:', { kit: t.kit, task_id: t.task_id, title: t.title });

  const { data: existing, error: queryErr } = await supabase.from('bb_tasks')
    .select('id, active').eq('kit', t.kit).eq('task_id', t.task_id).maybeSingle();
  if (queryErr) {
    console.error('upsertTask: existing query failed', queryErr);
    throw new Error("DB sorgu hatası: " + (queryErr.message || ""));
  }
  console.log('💾 existing row:', existing);

  // Build payload with explicit defaults — never let nulls cause CHECK violations
  const payload = {
    title: String(t.title || "").trim(),
    category: String(t.category || "").trim(),
    difficulty: parseInt(t.difficulty) || 1,
    expected_min: parseInt(t.expected_min) || 15,
    xp: parseInt(t.xp) || 10,
    emoji: t.emoji || "📋",
    description: t.description || "",
    answer: t.answer || "",
    learnings: Array.isArray(t.learnings) ? t.learnings : [],
    image_url: t.image_url || null,
    video_url: t.video_url || null,
    answer_image_url: t.answer_image_url || null,
    position: parseInt(t.position) || 0,
    active: true,  // always true (un-soft-delete if was deleted)
    updated_at: now,
  };

  if (existing) {
    console.log('💾 UPDATE existing.id =', existing.id);
    const { error } = await supabase.from('bb_tasks').update(payload).eq('id', existing.id);
    if (error) {
      console.error('💾 upsertTask UPDATE error:', error);
      throw new Error("Güncelleme hatası: " + (error.message || error.details || error.hint || "DB hatası"));
    }
    addLog({ type: 'task_updated', detail: `${t.kit} #${t.task_id}` });
    console.log('💾 UPDATE OK');
    return existing.id;
  } else {
    console.log('💾 INSERT new task');
    const insertData = { ...payload, kit: t.kit, task_id: parseInt(t.task_id), created_at: now };
    const { data, error } = await supabase.from('bb_tasks').insert(insertData).select().single();
    if (error) {
      console.error('💾 upsertTask INSERT error:', error);
      throw new Error("Ekleme hatası: " + (error.message || error.details || error.hint || JSON.stringify(error)));
    }
    if (!data) {
      throw new Error("Görev kaydedildi ama ID dönmedi");
    }
    console.log('💾 INSERT OK, id =', data.id);
    addLog({ type: 'task_created', detail: `${t.kit} #${t.task_id}: ${t.title}` });

    // Auto-seed progress rows for all students of this kit.
    // Rule: in task_id order (ascending), the FIRST task that isn't approved/in-flight becomes 'active',
    // all later tasks become 'locked'. In-flight statuses (in_progress, pending_review, rejected)
    // are preserved. Approved tasks ALWAYS preserved (student already finished them).
    //
    // For BerryBot, the original 36 hardcoded task IDs (1-36) are merged with DB additions.
    try {
      const { data: kitStudents } = await supabase.from('bb_users')
        .select('id').eq('role', 'student').eq('kit', t.kit);
      if (kitStudents && kitStudents.length > 0) {
        // All currently active DB tasks for this kit
        const { data: dbKitTasks } = await supabase.from('bb_tasks')
          .select('task_id').eq('kit', t.kit).eq('active', true);
        const dbIds = (dbKitTasks || [])
          .map(x => Number(x.task_id))   // supports decimals like 2.5
          .filter(n => !isNaN(n));

        // For BerryBot, also include the 36 hardcoded task IDs as base
        let allIds;
        if (t.kit === 'berrybot') {
          // Hardcoded 1..36 + DB additions (override duplicates by using Set)
          const idSet = new Set();
          for (let i = 1; i <= 36; i++) idSet.add(i);
          dbIds.forEach(id => idSet.add(id));
          allIds = Array.from(idSet);
        } else {
          allIds = dbIds;
        }

        const taskIds = allIds.sort((a, b) => a - b);  // ascending
        console.log('💾 Auto-seed task_ids (sorted):', taskIds);

        const PRESERVE = new Set(['approved', 'in_progress', 'pending_review', 'rejected']);

        for (const s of kitStudents) {
          const { data: existingProgress } = await supabase.from('bb_progress')
            .select('task_id, status').eq('student_id', s.id).eq('kit', t.kit);
          const progMap = new Map((existingProgress || []).map(p => [Number(p.task_id), p.status]));

          const newRows = [];
          let activeAssigned = false;
          for (const tid of taskIds) {
            const cur = progMap.get(tid);
            let status;
            if (cur && PRESERVE.has(cur)) {
              status = cur;
              if (cur !== 'approved') {
                activeAssigned = true;
              }
            } else if (!activeAssigned) {
              status = 'active';
              activeAssigned = true;
            } else {
              status = 'locked';
            }
            newRows.push({ student_id: s.id, task_id: tid, status, kit: t.kit });
          }
          console.log(`💾 Student ${s.id}:`, newRows.map(r => `${r.task_id}=${r.status}`).join(', '));

          if (newRows.length > 0) {
            const { error: progErr } = await supabase.from('bb_progress')
              .upsert(newRows, { onConflict: 'student_id,task_id' });
            if (progErr) console.error(`seed progress for ${s.id}:`, progErr);
          }
        }
        console.log(`💾 Re-seeded progress for ${kitStudents.length} ${t.kit} students`);
      }
    } catch (e) {
      console.error('auto-seed progress failed:', e);
    }

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
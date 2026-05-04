import { useState, useEffect, useCallback } from 'react';
import * as db from './db';

// ═══ LOCAL PHOTO STORAGE (IndexedDB) ═══
// Photos stay on each device, never sent to Supabase DB
const DB_NAME = 'berrybot_photos';
const STORE_NAME = 'photos';

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalPhoto(studentId, taskId, base64Data) {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(base64Data, `${studentId}_${taskId}`);
    console.log('📸 Photo saved locally:', studentId, taskId);
  } catch (e) { console.warn('Photo save failed:', e); }
}

export async function getLocalPhoto(studentId, taskId) {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(`${studentId}_${taskId}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

const DEFAULT_CL = [
  { id:"c1", name:"Sınıf 1", instructorId:"i1", canvasH:700, tables:[], objects:[] },
  { id:"c2", name:"Sınıf 2", instructorId:"i2", canvasH:700, tables:[], objects:[] },
];

export function useData() {
  const [users, setUsers] = useState([]);
  const [progress, setProgress] = useState({});
  const [meta, setMeta] = useState({});
  const [logs, setLogs] = useState([]);
  const [classLayout, setClassLayout] = useState(DEFAULT_CL);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [practiceProg, setPracticeProg] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [homeworkSubs, setHomeworkSubs] = useState([]);
  const [answerUnlocks, setAnswerUnlocks] = useState([]);
  const [customTasks, setCustomTasks] = useState([]);

  // SMART LOAD: students fetch only their 36 rows, admin/instructor fetch all (paginated)
  const loadAll = useCallback(async (user) => {
    const u = user || currentUser;
    try {
      if (u?.role === 'student') {
        const studentKit = u.kit || 'berrybot';
        const [sp, m, pp, hw, hs, au, ct] = await Promise.all([
          db.getStudentProgress(u.id),
          db.getAllMeta(),
          db.fetchPracticeProgress(u.id),
          db.fetchHomework(),
          db.fetchHomeworkSubmissions(),
          db.fetchAnswerUnlocks(u.id),
          db.fetchCustomTasks(studentKit),
        ]);
        setProgress(prev => ({ ...prev, [u.id]: sp }));
        setMeta(m);
        setPracticeProg(pp);
        setHomeworks(hw);
        setHomeworkSubs(hs.filter(s => s.student_id === u.id));
        setAnswerUnlocks(au);
        setCustomTasks(ct);
      } else if (u?.role === 'parent' && u.childId) {
        const [sp, m, l, hw, hs] = await Promise.all([
          db.getStudentProgress(u.childId),
          db.getAllMeta(),
          db.getLogs(500),
          db.fetchHomework(),
          db.fetchHomeworkSubmissions(),
        ]);
        setProgress(prev => ({ ...prev, [u.childId]: sp }));
        setMeta(m);
        setLogs(l.filter(lg => lg.userId === u.childId || lg.targetUser === u.childId));
        setHomeworks(hw);
        setHomeworkSubs(hs.filter(s => s.student_id === u.childId));
      } else {
        // Admin/instructor: fetch everything
        const [us, p, m, l, cl, hw, hs, au, ct] = await Promise.all([
          db.getUsers(), db.getAllProgress(), db.getAllMeta(), db.getLogs(200), db.getClassLayouts(),
          db.fetchHomework(), db.fetchHomeworkSubmissions(),
          db.fetchAnswerUnlocks(),
          db.fetchCustomTasks(),
        ]);
        setUsers(us); setProgress(p); setMeta(m); setLogs(l);
        setHomeworks(hw); setHomeworkSubs(hs);
        setAnswerUnlocks(au);
        setCustomTasks(ct);
        if (cl.length > 0) setClassLayout(cl);
      }
    } catch (e) { console.error('loadAll:', e); }
  }, [currentUser]);

  // Initial load — get users + layouts + check saved session
  useEffect(() => {
    (async () => {
      try {
        const [u, cl] = await Promise.all([db.getUsers(), db.getClassLayouts()]);
        setUsers(u);
        if (cl.length > 0) setClassLayout(cl);
        // ── 24h session restoration ──
        const saved = localStorage.getItem('bb_session');
        if (saved) {
          try {
            const s = JSON.parse(saved);
            const age = Date.now() - (s.ts || 0);
            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (age < ONE_DAY && s.userId) {
              const restored = u.find(x => x.id === s.userId);
              if (restored) {
                console.log('🔓 Session restored:', restored.name);
                setCurrentUser(restored);
                // Load data based on role
                if (restored.role === 'student') {
                  const [sp, m] = await Promise.all([db.getStudentProgress(restored.id), db.getAllMeta()]);
                  setProgress({[restored.id]: sp});
                  setMeta(m);
                } else if (restored.role === 'parent' && restored.childId) {
                  const [sp, m, l, cl] = await Promise.all([
                    db.getStudentProgress(restored.childId),
                    db.getAllMeta(),
                    db.getLogs(500),
                    db.getClassLayouts(),
                  ]);
                  setProgress({[restored.childId]: sp});
                  setMeta(m);
                  setLogs(l.filter(lg => lg.userId === restored.childId || lg.targetUser === restored.childId));
                  if (cl.length > 0) setClassLayout(cl);
                } else {
                  const [p, m, l] = await Promise.all([db.getAllProgress(), db.getAllMeta(), db.getLogs(200)]);
                  setProgress(p); setMeta(m); setLogs(l);
                }
              } else {
                localStorage.removeItem('bb_session');
              }
            } else {
              localStorage.removeItem('bb_session');
            }
          } catch { localStorage.removeItem('bb_session'); }
        }
      } catch(e) { console.error('init:', e); }
      setLoading(false);
    })();
  }, []);

  // Poll every 3s when logged in + realtime subscription
  useEffect(() => {
    if (!currentUser) return;
    const iv = setInterval(() => loadAll(), 3000);
    const unsub = db.subscribeToAll(() => loadAll());
    return () => { clearInterval(iv); unsub(); };
  }, [currentUser, loadAll]);

  // Auth
  const login = useCallback(async (email, pw) => {
    const u = await db.loginUser(email, pw);
    if (u) {
      setCurrentUser(u);
      // Save session for 24h
      localStorage.setItem('bb_session', JSON.stringify({ userId: u.id, ts: Date.now() }));
      // Load full data for this user's role
      if (u.role === 'student') {
        const [sp, m] = await Promise.all([db.getStudentProgress(u.id), db.getAllMeta()]);
        setProgress(prev => ({ ...prev, [u.id]: sp }));
        setMeta(m);
      } else if (u.role === 'parent' && u.childId) {
        // Parent: load own child's progress + child's logs + class layouts
        const [sp, m, l, cl] = await Promise.all([
          db.getStudentProgress(u.childId),
          db.getAllMeta(),
          db.getLogs(500),
          db.getClassLayouts(),
        ]);
        setProgress(prev => ({ ...prev, [u.childId]: sp }));
        setMeta(m);
        // Filter logs to only this child
        setLogs(l.filter(lg => lg.userId === u.childId || lg.targetUser === u.childId));
        if (cl.length > 0) setClassLayout(cl);
      } else {
        const [us, p, m, l, cl] = await Promise.all([
          db.getUsers(), db.getAllProgress(), db.getAllMeta(), db.getLogs(200), db.getClassLayouts(),
        ]);
        setUsers(us); setProgress(p); setMeta(m); setLogs(l);
        if (cl.length > 0) setClassLayout(cl);
      }
    }
    return u;
  }, []);

  const logout = useCallback(() => {
    if (currentUser?.role === 'student') db.setOnline(currentUser.id, false);
    localStorage.removeItem('bb_session');
    setCurrentUser(null);
  }, [currentUser]);

  // Patch local state instantly, then write DB, then reload after 2s
  const patch = useCallback((sid, tid, fields) => {
    setProgress(prev => ({
      ...prev,
      [sid]: { ...(prev[sid]||{}), [tid]: { ...(prev[sid]?.[tid]||{}), ...fields } }
    }));
  }, []);

  const after = useCallback(() => { setTimeout(() => loadAll(), 2000); }, [loadAll]);

  const addUser = useCallback(async (d) => {
    const u = await db.createUser(d);
    setTimeout(async () => { setUsers(await db.getUsers()); }, 500);
    return u;
  }, []);

  const startTask = useCallback((sid, tid) => {
    patch(sid, tid, { status: 'in_progress', startedAt: Date.now() });
    db.startTask(sid, tid).then(after);
  }, [patch, after]);

  const submitTask = useCallback((sid, tid, photoData) => {
    patch(sid, tid, { status: 'pending_review', completedAt: Date.now(), photo: photoData ? 'local' : null });
    if (photoData) saveLocalPhoto(sid, tid, photoData);
    db.submitTask(sid, tid, !!photoData).then(after);
  }, [patch, after]);

  const approveTask = useCallback((sid, tid, note) => {
    if (!currentUser) return;
    patch(sid, tid, { status: 'approved', approvedAt: Date.now(), instructorNote: note||'Onaylandı ✓' });
    // Unlock next task locally (unless already beyond locked)
    if (tid < 36) {
      const nextStatus = progress[sid]?.[tid+1]?.status;
      if (!nextStatus || nextStatus === 'locked') {
        patch(sid, tid+1, { status: 'active' });
      }
    }
    db.approveTask(currentUser.id, sid, tid, note).then(() => {
      // Reload quickly to get DB state
      setTimeout(() => loadAll(), 500);
      setTimeout(() => loadAll(), 2000);
    });
  }, [currentUser, patch, after, progress, loadAll]);

  const rejectTask = useCallback((sid, tid, note) => {
    if (!currentUser) return;
    patch(sid, tid, { status: 'rejected', instructorNote: note||'Tekrar dene' });
    db.rejectTask(currentUser.id, sid, tid, note).then(after);
  }, [currentUser, patch, after]);

  const resubmitTask = useCallback((sid, tid) => {
    patch(sid, tid, { status: 'in_progress', startedAt: Date.now() });
    db.resubmitTask(sid, tid).then(after);
  }, [patch, after]);

  const requestHelp = useCallback((sid) => {
    setMeta(prev => ({...prev, [sid]: {...(prev[sid]||{}), help_request: Date.now()}}));
    db.requestHelp(sid).then(after);
  }, [after]);

  const clearHelp = useCallback((sid) => {
    setMeta(prev => ({...prev, [sid]: {...(prev[sid]||{}), help_request: null}}));
    db.clearHelp(sid).then(after);
  }, [after]);

  const saveLayout = useCallback(async (layouts) => {
    await db.saveAllLayouts(layouts);
    setClassLayout(layouts);
  }, []);

  const setProgressTo = useCallback(async (sid, fromTask) => {
    await db.setStudentProgressTo(sid, fromTask);
    setTimeout(() => loadAll(), 500);
  }, [loadAll]);

  // Merge progress + meta
  const merged = {};
  Object.keys(progress).forEach(sid => { merged[sid] = { ...progress[sid] }; });
  Object.keys(meta).forEach(sid => {
    if (!merged[sid]) merged[sid] = {};
    merged[sid].helpRequest = meta[sid]?.help_request;
    merged[sid].online = meta[sid]?.online;
    merged[sid].lastSeen = meta[sid]?.last_seen;
    merged[sid].currentPage = meta[sid]?.current_page;
    merged[sid].currentTaskId = meta[sid]?.current_task_id;
    merged[sid].pageUpdatedAt = meta[sid]?.page_updated_at;
  });

  const setCurrentPage = useCallback((page, taskId) => {
    if (currentUser?.role === 'student') {
      db.setCurrentPage(currentUser.id, page, taskId);
    }
  }, [currentUser]);

  // ─── PRACTICE ACTIONS ───
  const recordPractice = useCallback(async ({ questionId, category, topic, isCorrect, xp }) => {
    if (!currentUser) return;
    await db.recordPracticeAttempt({ studentId: currentUser.id, questionId, category, topic, isCorrect, xp });
    const pp = await db.fetchPracticeProgress(currentUser.id);
    setPracticeProg(pp);
  }, [currentUser]);

  // ─── HOMEWORK ACTIONS ───
  const addHomework = useCallback(async (data) => {
    if (!currentUser) return;
    await db.createHomework({ ...data, instructorId: currentUser.id });
    const [hw, hs] = await Promise.all([db.fetchHomework(), db.fetchHomeworkSubmissions()]);
    setHomeworks(hw); setHomeworkSubs(hs);
  }, [currentUser]);

  const removeHomework = useCallback(async (id) => {
    if (!currentUser) return;
    await db.deleteHomework(id, currentUser.id);
    const hw = await db.fetchHomework();
    setHomeworks(hw);
  }, [currentUser]);

  const sendHomework = useCallback(async ({ homeworkId, photoFlag, note }) => {
    if (!currentUser) return;
    await db.submitHomework({ homeworkId, studentId: currentUser.id, photoFlag, note });
    const hs = await db.fetchHomeworkSubmissions();
    setHomeworkSubs(hs.filter(s => s.student_id === currentUser.id));
  }, [currentUser]);

  const reviewHw = useCallback(async ({ submissionId, status, instructorNote }) => {
    if (!currentUser) return;
    await db.reviewHomework({ submissionId, status, instructorNote, instructorId: currentUser.id });
    const hs = await db.fetchHomeworkSubmissions();
    setHomeworkSubs(hs);
  }, [currentUser]);

  const toggleAnswerUnlock = useCallback(async ({ studentId, taskId, unlock }) => {
    if (!currentUser) return;
    if (unlock) {
      await db.unlockAnswer({ studentId, taskId, instructorId: currentUser.id });
    } else {
      await db.lockAnswer({ studentId, taskId, instructorId: currentUser.id });
    }
    const au = await db.fetchAnswerUnlocks();
    setAnswerUnlocks(au);
  }, [currentUser]);

  const saveCustomTask = useCallback(async (taskData) => {
    if (!currentUser) return null;
    const id = await db.upsertTask(taskData);
    const ct = await db.fetchCustomTasks();
    setCustomTasks(ct);
    return id;
  }, [currentUser]);

  const removeCustomTask = useCallback(async (id) => {
    if (!currentUser) return;
    await db.deleteTask(id);
    const ct = await db.fetchCustomTasks();
    setCustomTasks(ct);
  }, [currentUser]);

  const uploadMedia = useCallback(async ({ kit, taskId, type, file }) => {
    if (!currentUser) return null;
    return await db.uploadTaskMedia({ kit, taskId, type, file });
  }, [currentUser]);

  return {
    loading, currentUser, users, progress: merged, logs, classLayout,
    practiceProg, homeworks, homeworkSubs, answerUnlocks, customTasks,
    login, logout, addUser, startTask, submitTask, approveTask,
    rejectTask, resubmitTask, requestHelp, clearHelp, saveLayout, setProgressTo, setCurrentPage, refresh: loadAll,
    recordPractice, addHomework, removeHomework, sendHomework, reviewHw,
    toggleAnswerUnlock,
    saveCustomTask, removeCustomTask, uploadMedia,
  };
}
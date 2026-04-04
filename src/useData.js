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

  // SMART LOAD: students fetch only their 36 rows, admin/instructor fetch all (paginated)
  const loadAll = useCallback(async (user) => {
    const u = user || currentUser;
    try {
      if (u?.role === 'student') {
        const [sp, m] = await Promise.all([
          db.getStudentProgress(u.id),
          db.getAllMeta(),
        ]);
        setProgress(prev => ({ ...prev, [u.id]: sp }));
        setMeta(m);
      } else {
        // Admin/instructor: fetch everything
        const [us, p, m, l, cl] = await Promise.all([
          db.getUsers(), db.getAllProgress(), db.getAllMeta(), db.getLogs(200), db.getClassLayouts(),
        ]);
        setUsers(us); setProgress(p); setMeta(m); setLogs(l);
        if (cl.length > 0) setClassLayout(cl);
      }
    } catch (e) { console.error('loadAll:', e); }
  }, [currentUser]);

  // Initial load — get users + layouts (lightweight)
  useEffect(() => {
    (async () => {
      try {
        const [u, cl] = await Promise.all([db.getUsers(), db.getClassLayouts()]);
        setUsers(u);
        if (cl.length > 0) setClassLayout(cl);
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
      // Load full data for this user's role
      if (u.role === 'student') {
        const [sp, m] = await Promise.all([db.getStudentProgress(u.id), db.getAllMeta()]);
        setProgress(prev => ({ ...prev, [u.id]: sp }));
        setMeta(m);
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
  });

  return {
    loading, currentUser, users, progress: merged, logs, classLayout,
    login, logout, addUser, startTask, submitTask, approveTask,
    rejectTask, resubmitTask, requestHelp, clearHelp, saveLayout, setProgressTo, refresh: loadAll,
  };
}
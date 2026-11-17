/* 데이터 로직: 할 일, 습관, 나에게 남기는 말 */
(function () {
  const U = TD.util;
  const S = TD.store;
  const M = (TD.model = {});

  /* ---------- 카테고리 ---------- */
  M.categories = () => [...S.get().categories].sort((a, b) => a.order - b.order);
  M.cat = (id) => S.get().categories.find((c) => c.id === id);
  M.catColor = (id) => TD.COLORS[(M.cat(id) || {}).color] || TD.COLORS.gray;
  M.addCategory = (name, color) =>
    S.update((s) => s.categories.push({ id: U.uid(), name, color, order: Math.max(-1, ...s.categories.map((c) => c.order)) + 1 }));
  M.updateCategory = (id, patch) => S.update((s) => Object.assign(s.categories.find((c) => c.id === id), patch));
  M.removeCategory = (id) =>
    S.update((s) => {
      s.categories = s.categories.filter((c) => c.id !== id);
      s.todos = s.todos.filter((t) => t.categoryId !== id);
    });

  /* ---------- 할 일 ---------- */
  M.todo = (id) => S.get().todos.find((t) => t.id === id);
  M.todosOn = (date) => S.get().todos.filter((t) => t.date === date).sort((a, b) => a.order - b.order);
  M.addTodo = (text, date, categoryId) =>
    S.update((s) => s.todos.push({ id: U.uid(), text, date, categoryId, done: false, doneAt: null, order: Date.now() }));
  M.toggleTodo = (id) =>
    S.update((s) => {
      const t = s.todos.find((x) => x.id === id);
      t.done = !t.done;
      t.doneAt = t.done ? new Date().toISOString() : null;
    });
  M.updateTodo = (id, patch) => S.update((s) => Object.assign(s.todos.find((x) => x.id === id), patch));
  M.moveTodo = (id, date) => M.updateTodo(id, { date, order: Date.now() });
  M.removeTodo = (id) => S.update((s) => (s.todos = s.todos.filter((x) => x.id !== id)));
  /* ---------- 주간 보드 (큰 할 일 덩어리, 세부 할 일과 따로) ---------- */
  M.chunk = (id) => (S.get().board || []).find((x) => x.id === id);
  M.chunksOn = (date) => (S.get().board || []).filter((x) => x.date === date).sort((a, b) => a.order - b.order);
  M.addChunk = (text, date) =>
    S.update((s) => (s.board = s.board || []).push({ id: U.uid(), text, date, color: null, done: false, order: Date.now() }));
  M.updateChunk = (id, patch) => S.update((s) => Object.assign(s.board.find((x) => x.id === id), patch));
  M.removeChunk = (id) => S.update((s) => (s.board = s.board.filter((x) => x.id !== id)));
  /** 끌어서 놓은 뒤: 그 목록의 순서대로 다시 번호를 매겨요 */
  M.reorder = (key, ids, patch) =>
    S.update((s) =>
      ids.forEach((id, i) => {
        const x = s[key].find((t) => t.id === id);
        if (x) Object.assign(x, patch, { order: i });
      })
    );
  /** 오늘 이전 날짜인데 아직 못 한 일 */
  M.overdue = () => {
    const t = U.today();
    return S.get().todos.filter((x) => !x.done && x.date < t).sort((a, b) => (a.date < b.date ? -1 : 1));
  };
  M.moveOverdueToToday = () => {
    const t = U.today();
    let i = 0;
    S.update((s) =>
      s.todos.forEach((x) => {
        if (!x.done && x.date < t) {
          x.date = t;
          x.order = Date.now() + i++;
        }
      })
    );
  };
  M.dayStatus = (date) => {
    const l = M.todosOn(date);
    return { total: l.length, left: l.filter((t) => !t.done).length };
  };

  /* ---------- 습관 ---------- */
  M.TIMES = { morning: 'Morning', any: 'Anytime', evening: 'Evening' };
  const TIME_ORDER = { morning: 0, any: 1, evening: 2 };

  M.habit = (id) => S.get().habits.find((h) => h.id === id);
  M.habits = () => S.get().habits.filter((h) => !h.archived).sort((a, b) => TIME_ORDER[a.time] - TIME_ORDER[b.time]);
  M.isScheduled = (h, date) => h.days.includes(U.dow(date));
  M.goal = (h) => (h.target && h.target > 1 ? h.target : 1);
  M.hval = (h, date) => (S.get().habitLogs[h.id] || {})[date] || 0;
  M.isDone = (h, date) => M.hval(h, date) >= M.goal(h);
  M.setHval = (h, date, v) =>
    S.update((s) => {
      const log = (s.habitLogs[h.id] = s.habitLogs[h.id] || {});
      v = Math.max(0, Math.min(v, 999));
      if (v) log[date] = v;
      else delete log[date];
      // 만든 날보다 이전 날짜를 체크하면 그날부터 기록이 시작된 걸로 봐요
      const hh = s.habits.find((x) => x.id === h.id);
      if (v && hh && date < hh.createdAt) hh.createdAt = date;
    });
  M.toggleHabit = (h, date) => M.setHval(h, date, M.isDone(h, date) ? 0 : M.goal(h));

  /** 연속 기록: 해야 하는 날만 세고, 오늘을 아직 안 했으면 어제부터 셉니다 */
  M.streak = (h, today = U.today()) => {
    let d = today;
    if (M.isScheduled(h, d) && !M.isDone(h, d)) d = U.addDays(d, -1);
    let n = 0;
    for (let i = 0; i < 1000 && d >= h.createdAt; i++) {
      if (M.isScheduled(h, d)) {
        if (M.isDone(h, d)) n++;
        else break;
      }
      d = U.addDays(d, -1);
    }
    return n;
  };
  M.todayHabits = () => M.habits().filter((h) => M.isScheduled(h, U.today()));
  M.saveHabit = (data, id) =>
    S.update((s) => {
      if (id) Object.assign(s.habits.find((h) => h.id === id), data);
      else s.habits.push({ id: U.uid(), createdAt: U.today(), archived: false, ...data });
    });
  M.removeHabit = (id) =>
    S.update((s) => {
      s.habits = s.habits.filter((h) => h.id !== id);
      delete s.habitLogs[id];
    });
  M.daysLabel = (days) => {
    const set = [...days].sort().join('');
    if (set === '0123456') return 'Daily';
    if (set === '12345') return 'Weekdays';
    if (set === '06') return 'Weekends';
    return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => U.DOW[d]).join(' ');
  };

  /* ---------- 나에게 남기는 말 / 마음가짐 ---------- */
  M.MAX_PINNED = 3;
  M.note = (id) => S.get().notes.find((n) => n.id === id);
  M.notes = (kind) =>
    S.get()
      .notes.filter((n) => n.kind === kind)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  M.pinnedMindsets = () => M.notes('mindset').filter((n) => n.pinned && !n.hidden);
  M.addNote = (text, kind) =>
    S.update((s) => {
      const pinnedCount = s.notes.filter((n) => n.kind === 'mindset' && n.pinned).length;
      s.notes.push({
        id: U.uid(),
        text,
        kind,
        pinned: kind === 'mindset' && pinnedCount < M.MAX_PINNED,
        hidden: false,
        source: 'manual',
        createdAt: new Date().toISOString(),
      });
    });
  M.updateNote = (id, patch) => S.update((s) => Object.assign(s.notes.find((n) => n.id === id), patch));
  M.removeNote = (id) => S.update((s) => (s.notes = s.notes.filter((n) => n.id !== id)));
  /** 고정은 최대 3개. 성공하면 true */
  M.togglePin = (id) => {
    const n = M.note(id);
    if (!n.pinned && M.pinnedMindsets().length >= M.MAX_PINNED) return false;
    M.updateNote(id, { pinned: !n.pinned });
    return true;
  };
  M.randomMessage = (excludeId) => {
    const list = S.get().notes.filter((n) => n.kind === 'message' && !n.hidden);
    if (!list.length) return null;
    const pool = list.length > 1 ? list.filter((n) => n.id !== excludeId) : list;
    return pool[Math.floor(Math.random() * pool.length)];
  };
})();

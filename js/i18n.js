/* 언어: 기본은 한국어, 설정에서 영어로 바꿀 수 있어요.
   코드에는 영어 문장을 쓰고, 한국어일 때 아래 사전에서 바꿔 보여줘요. {n} 같은 자리는 값으로 채워요. */
(function () {
  const KO = {
    // 메뉴
    'Today': '오늘', 'Tasks': '할 일', 'Habits': '습관', 'Notes': '기록', 'Focus': '집중', 'Glimmers': '행복 상자', 'Settings': '설정',
    '{n} open': '남은 일 {n}',
    // 공통
    'Save': '저장', 'Cancel': '취소', 'Delete': '삭제', 'Add': '추가', 'Create': '만들기', 'Close': '닫기', 'Edit': '수정',
    'More': '더보기', 'Nothing yet': '아직 없어요', 'add': '추가', 'all': '전체', 'Another': '다른 거', 'edit': '수정',
    'Name': '이름', 'Color': '색', 'None': '없음', 'Move': '옮기기', 'Previous week': '지난주', 'Next week': '다음 주',
    'Previous month': '지난달', 'Next month': '다음 달', 'Minus': '빼기', 'Plus': '더하기', 'today': '오늘',
    'Could not save — storage full': '저장 공간이 꽉 차서 저장하지 못했어요',
    // 오늘
    'note to self': '나에게 한마디', 'principles': '마음가짐', 'glimmers': '행복 상자', 'tasks': '할 일', 'habits': '습관',
    '{n} overdue': '밀린 일 {n}개', 'Move to today': '오늘로 옮기기', 'Open a random glimmer': '행복 상자 열기',
    'The box is empty.': '상자가 비어 있어요.', 'Add something good': '좋았던 순간 담기',
    // 할 일
    'Week': '주', 'Month': '월', 'Board': '보드', 'Categories': '카테고리', 'week': '이번 주', 'month': '이번 달',
    '{d}/{n} done · {f} full days': '{d}/{n} 완료 · 다 끝낸 날 {f}일',
    'Add category': '카테고리 추가', 'Add to {c}': '{c}에 추가', 'New {c} task': '새 {c} 할 일', 'Edit task': '할 일 수정',
    'Tomorrow': '내일로', 'Change date': '날짜 바꾸기', 'Change category': '카테고리 바꾸기', 'Category': '카테고리', 'Task': '할 일',
    'Edit category': '카테고리 수정', 'New category': '새 카테고리', 'Delete category': '카테고리 삭제',
    "'{c}' and its {n} tasks will be deleted.": "'{c}'와 할 일 {n}개가 삭제돼요.",
    // 보드
    'Block': '블록', 'Move to…': '다른 날로 옮기기', 'Move to': '옮길 날', 'Next week, same day': '다음 주 같은 요일',
    'Add on {d}': '{d}에 추가', 'Done': '완료',
    // 습관
    'New habit': '새 습관', 'Edit habit': '습관 수정', 'Delete habit': '습관 삭제', 'Nothing today': '오늘은 없어요', 'rest': '나머지',
    'streak {n}': '연속 {n}', 'best {n}': '최고 {n}', 'total {n}': '총 {n}', 'since {d}': '{d}부터', '{n}d': '{n}일째',
    'Days': '요일', 'daily': '매일', 'weekdays': '평일', 'weekends': '주말', 'Time': '시간대', 'Daily goal': '하루 목표', 'optional': '선택',
    'cups': '잔', 'Daily': '매일', 'Weekdays': '평일', 'Weekends': '주말', 'Morning': '아침', 'Anytime': '언제든', 'Evening': '저녁',
    "'{h}' and its history will be deleted.": "'{h}'와 지금까지의 기록이 삭제돼요.",
    // 기록
    'write': '쓰기', 'notes to self': '나에게 한마디', 'Notes to self': '나에게 한마디', 'Principles': '마음가짐',
    'pinned {n}/{m}': '고정 {n}/{m}', 'pinned': '고정', 'hidden': '숨김', 'Pin': '고정', 'Show': '보이기', 'Hide': '숨기기',
    'Note to self': '나에게 한마디', 'Principle': '마음가짐', 'Delete this?': '삭제할까요?', 'Max {n} pinned': '최대 {n}개까지 고정할 수 있어요',
    // 집중
    'focus': '집중', 'break': '휴식', 'Break': '휴식', '{n} min': '{n}분', 'Start': '시작', 'Pause': '일시정지', 'Resume': '계속',
    'Reset': '처음으로', 'Skip to break': '휴식으로 넘기기', 'Skip break': '휴식 건너뛰기', 'minutes': '시간 설정',
    'Break starts on its own after focus.': '집중이 끝나면 휴식이 자동으로 시작돼요.', 'No sessions yet': '아직 없어요',
    'focusing': '집중 중', 'on break': '휴식 중', 'Focus minutes': '집중 시간(분)', 'Break minutes': '휴식 시간(분)',
    'Focus done. {n} min break.': '집중 끝! {n}분 쉬어요.', 'Focus done — break time': '집중 끝 — 쉬는 시간이에요', 'Break over.': '휴식 끝!', 'Break over': '휴식 끝',
    '{n} · {m} min': '{n}번 · {m}분',
    // 행복 상자
    'open': '열기', 'another': '다른 거', 'delete': '삭제', 'Something good…': '좋았던 순간…', 'Note to future me': '나중의 나에게',
    'Link (YouTube shows a thumbnail)': '링크 (유튜브는 썸네일로 보여요)', 'Photo / video': '사진 / 영상', '{n} file': '파일 {n}개', '{n} files': '파일 {n}개',
    'Max 50MB per file': '파일 하나당 50MB까지예요', 'Could not save file': '파일을 저장하지 못했어요', 'Delete this glimmer?': '이 순간을 삭제할까요?',
    'Play on YouTube': '유튜브에서 보기',
    // 설정
    'Language': '언어', 'Text color': '글자 색', 'Ink': '먹색', 'Blue': '파랑', 'Sepia': '세피아',
    'Sync': '동기화', 'not set up': '설정 안 됨', 'offline': '오프라인', 'connecting…': '연결 중…', 'signed out': '로그아웃됨',
    'Email': '이메일', 'Password': '비밀번호', 'Sign in': '로그인', 'syncing…': '동기화 중…', 'synced {t}': '{t} 동기화됨', 'error': '오류',
    'Sync now': '지금 동기화', 'Sign out': '로그아웃', 'Backup': '백업', 'photos not included': '사진은 빠져요', 'Export': '내보내기', 'Import': '가져오기',
    'Delete everything': '전부 삭제', 'Email and 6+ char password': '이메일과 6자 이상 비밀번호를 넣어 주세요', 'Sign in failed': '로그인하지 못했어요',
    'This replaces your current data.': '지금 데이터가 이 파일로 바뀌어요.', 'Not a TendDay backup': 'TendDay 백업 파일이 아니에요', 'This cannot be undone.': '되돌릴 수 없어요.',
    // 색 이름
    'Moss': '이끼', 'Sage': '세이지', 'Bark': '나무껍질', 'Terracotta': '테라코타', 'Dry leaf': '마른 잎', 'Clay rose': '흙장미', 'Wildflower': '들꽃', 'Lake': '호수', 'Sand': '모래',
  };

  TD.lang = () => (TD.store && TD.store.get().settings.lang) || 'ko';
  TD.t = (s, vars) => {
    let out = TD.lang() === 'ko' && KO[s] != null ? KO[s] : s;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return out;
  };
})();

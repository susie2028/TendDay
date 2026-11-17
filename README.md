# TendDay

하루를 챙기는 개인 루틴 관리 웹사이트. (1단계)

단축키: 1~5 메뉴 이동, `,` 설정. 지금은 PC 웹 화면 기준이에요.

## 실행 방법

- `index.html`을 더블클릭하면 브라우저에서 바로 열려요.
- VS Code를 쓴다면 **Live Server** 확장을 설치하고, `index.html`에서 오른쪽 클릭 → "Open with Live Server". 저장할 때마다 화면이 자동으로 새로고침돼요.

## 메뉴

| 메뉴 | 기능 |
| --- | --- |
| Today | 나에게 남긴 말, 고정한 원칙, 버섯 통나무, 오늘 할 일·습관 |
| Tasks | 주/월 달력, 카테고리별 할 일 |
| Habits | 습관 체크, 연속 기록, 한 달 달력 |
| Notes | 나에게 남기는 말, 원칙(최대 3개 고정) |
| Decide | Yes/No 흐름도로 고민 정리, 고른 행동은 할 일로 보내기 |
| Glimmers | 좋았던 순간(글·사진·영상·링크) 모아두고 랜덤으로 꺼내 보기 |

데이터는 이 브라우저에만 저장돼요. Glimmers의 사진·영상은 백업 파일에 포함되지 않아요.

## 파일 구조

```
index.html          화면 틀
css/style.css       디자인 (맨 위 색 변수만 바꾸면 전체 색이 바뀌어요)
js/utils.js         날짜 계산 등 공용 도구, 카테고리 색
js/store.js         저장소 (2단계에서 동기화로 바꿀 곳)
js/model.js         할 일·습관·기록 데이터 로직
js/ui.js            아이콘, 모달, 메뉴, 토스트
js/media.js         Glimmers 사진·영상 저장 (IndexedDB)
js/views/*.js       화면별 코드 (garden, home, todo, habits, notes, decide, glimmers, settings)
js/app.js           웹사이트 시작 파일: 메뉴, 화면 그리기, 단축키, 글자 색
img/bg-painting.jpg 배경 그림 (img 폴더의 나머지 이미지는 안 씀)
```

## 다음 단계

- **2단계**: 약속·말 기록함, 모닝페이지, 루틴 묶음, 폰·PC 동기화(Supabase) + 배포(GitHub Pages 또는 Vercel)

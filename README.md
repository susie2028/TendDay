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

## 폰·PC 동기화 (Supabase)

1. https://supabase.com 에서 무료 가입 → New project 만들기 (지역: Northeast Asia (Seoul))
2. 왼쪽 메뉴 SQL Editor → `supabase-setup.sql` 내용을 통째로 붙여넣고 Run
3. Authentication → Sign In / Providers → Email에서 "Confirm email" 끄기 (켜두면 가입 후 메일 인증 필요)
4. Project Settings → API에서 Project URL과 anon public key를 복사해 `js/config.js`에 넣기
5. TendDay → Settings → Create account (처음 한 번) → 이후엔 Sign in

로그인하면 할 일·습관·기록·Decide·Glimmers가 자동으로 동기화돼요. 사진·영상은 파일당 50MB까지예요.
처음 로그인한 기기에서는 서버 데이터가 우선이고, 그 뒤로는 가장 최근에 바뀐 쪽이 반영돼요.

폰에서 쓰려면 이 폴더를 GitHub Pages나 Netlify 같은 곳에 올려서 주소로 열면 돼요. 폰에서 "홈 화면에 추가"하면 앱처럼 쓸 수 있어요.

## 파일 구조

```
index.html          화면 틀
css/style.css       디자인 (맨 위 색 변수만 바꾸면 전체 색이 바뀌어요)
js/utils.js         날짜 계산 등 공용 도구, 카테고리 색
js/store.js         저장소 (2단계에서 동기화로 바꿀 곳)
js/model.js         할 일·습관·기록 데이터 로직
js/ui.js            아이콘, 모달, 메뉴, 토스트
js/config.js        Supabase 주소·키
js/sync.js          동기화 (로그인, 데이터, 사진·영상)
js/media.js         Glimmers 사진·영상 저장 (IndexedDB)
supabase-setup.sql  Supabase에 한 번 실행할 설정
js/views/*.js       화면별 코드 (garden, home, todo, habits, notes, decide, glimmers, settings)
js/app.js           웹사이트 시작 파일: 메뉴, 화면 그리기, 단축키, 글자 색
img/bg-painting.jpg 배경 그림 (img 폴더의 나머지 이미지는 안 씀)
```

## 다음 단계

- 다음: 약속·말 기록함, 모닝페이지, 루틴 묶음

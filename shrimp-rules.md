# SingMystage 개발 가이드라인

## 프로젝트 개요

**프로젝트명**: SingMystage (YouTube 기반 노래방 웹 애플리케이션)  
**기술 스택**: React 19 + TypeScript + Firebase + YouTube API + Tailwind CSS  
**배포 환경**: Netlify (프론트엔드) + Firebase Functions (백엔드)  
**주요 기능**: YouTube 검색, 스트림 재생, 사용자 인증, 즐겨찾기, 최근 재생 목록

## 프로젝트 아키텍처

### 디렉토리 구조 규칙

- `src/components/`: 기능별 컴포넌트 분리 (Auth, Common, Favorites, Player, Search, SidePanel, User, VideoPanel)
- `src/services/`: API 통신 및 비즈니스 로직 (Firebase, YouTube API)
- `src/hooks/`: 커스텀 React 훅
- `src/types/`: TypeScript 타입 정의
- `src/pages/`: 페이지 컴포넌트
- `functions/`: Firebase Functions (YouTube API 처리)

### 핵심 파일 의존성

- **Firebase 설정**: `src/firebase.ts` ↔ `functions/index.js` (한국 리전 연동)
- **YouTube API**: `src/services/youtubeApi.ts` ↔ `functions/index.js` (Functions 호출)
- **메인 앱**: `src/App.tsx` ↔ `src/pages/MainPage.tsx` (인증 기반 라우팅)

## 코드 표준

### 명명 규칙

- **컴포넌트**: PascalCase (예: `SearchContainer.tsx`)
- **훅**: camelCase with 'use' prefix (예: `useAuth.ts`)
- **서비스**: camelCase with service suffix (예: `youtubeApi.ts`)
- **타입**: PascalCase with interface/type prefix (예: `YouTubeSearchResults`)

### 파일 구조 표준

- 모든 React 컴포넌트는 TypeScript (.tsx) 사용
- 서비스 파일은 .ts 확장자 사용
- 각 컴포넌트는 기본 export 사용
- 인터페이스는 별도 types 폴더에 정의

### 스타일링 규칙

- **필수**: Tailwind CSS 클래스만 사용
- **네온 효과**: `text-neon-cyan`, `shadow-neon-cyan`, `animate-pulse-glow` 사용
- **다크 테마**: `bg-dark-bg`, `bg-dark-card` 클래스 활용
- **반응형**: 모바일 우선 설계 (`lg:` 접두사 활용)

## 기능 구현 표준

### Firebase 연동 규칙

- **필수**: 한국 리전 사용 (`asia-northeast3`)
- **환경 변수**: 모든 Firebase 설정은 `REACT_APP_FIREBASE_*` 형식
- **Functions 호출**: `httpsCallable`을 통한 안전한 호출
- **에러 처리**: 한국어 에러 메시지 필수

```typescript
// 올바른 Firebase Functions 호출 패턴
const functionName = httpsCallable(functions, 'functionName');
try {
  const result = await functionName(data);
  return result.data;
} catch (error) {
  throw new Error('한국어 에러 메시지');
}
```

### YouTube API 처리 규칙

- **필수**: Firebase Functions를 통한 간접 호출만 허용
- **금지**: 클라이언트에서 직접 YouTube API 호출 금지
- **스트림 URL**: `getAdFreeStreamUrl` 함수만 사용
- **검색**: `searchYouTube` 함수만 사용

### 컴포넌트 구조 규칙

- **Lazy Loading**: 주요 패널은 `React.lazy()` 사용 필수
- **State 관리**: 상태는 최상위 컴포넌트에서 관리
- **Props 전달**: 명확한 타입 정의와 함께 props 전달
- **에러 바운더리**: 각 주요 컴포넌트에 에러 처리 구현

```typescript
// 올바른 Lazy Loading 패턴
const SidePanel = React.lazy(() => import('../components/SidePanel/SidePanel'));
const VideoPanel = React.lazy(() => import('../components/VideoPanel/VideoPanel'));

// Suspense로 감싸기 필수
<Suspense fallback={<LoadingSpinner />}>
  <SidePanel />
</Suspense>
```

## 외부 라이브러리 사용 표준

### 허용된 라이브러리

- **UI**: Lucide React (아이콘), Tailwind CSS
- **라우팅**: React Router DOM
- **HTTP**: Axios (YouTube API 호출용)
- **에러 추적**: Sentry
- **인증**: Firebase Auth

### 금지된 라이브러리

- ❌ Bootstrap, Material-UI (Tailwind와 충돌)
- ❌ jQuery (React와 호환성 문제)
- ❌ 직접적인 YouTube 플레이어 라이브러리

## Netlify 배포 워크플로우

### 빌드 설정 규칙

- **빌드 명령**: `npm run build` (Create React App 표준)
- **배포 디렉토리**: `build/`
- **Node.js 버전**: 18 이상
- **리다이렉트**: SPA를 위한 `/*` → `/index.html` 설정 필수

### 환경 변수 설정 (Netlify)

```bash
# 필수 환경 변수
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
REACT_APP_USE_FUNCTIONS_EMULATOR=false
```

### Firebase Functions 별도 배포

- **필수**: Firebase Functions는 별도로 배포
- **명령**: `npm run deploy:functions` 또는 `firebase deploy --only functions`
- **리전**: 한국 리전 (`asia-northeast3`) 설정 유지

## 주요 파일 상호작용 표준

### 파일 수정 시 연동 규칙

1. **Firebase 설정 변경 시**:
   - `src/firebase.ts` 수정 → `functions/index.js` 리전 설정 확인 필요
   - 환경 변수 변경 → Netlify 설정 동기화 필요

2. **YouTube API 함수 변경 시**:
   - `functions/index.js` 수정 → `src/services/youtubeApi.ts` 호출 방식 확인
   - 새 Functions 추가 → 클라이언트 서비스 업데이트 필요

3. **컴포넌트 구조 변경 시**:
   - `src/components/` 변경 → `src/pages/MainPage.tsx` import 확인
   - Lazy Loading 추가 → Suspense 래퍼 확인

### 타입 정의 동기화

- YouTube API 응답 → `src/types/youtube.ts` 업데이트
- Firebase Functions 응답 → 클라이언트 타입 동기화
- 컴포넌트 Props → 타입 정의 필수

## AI 의사결정 표준

### 우선순위 판단 기준

1. **보안**: Firebase 규칙 및 환경 변수 보호 최우선
2. **성능**: Lazy Loading 및 메모이제이션 적용
3. **사용자 경험**: 한국어 에러 메시지 및 로딩 상태 표시
4. **유지보수**: 컴포넌트 분리 및 타입 안정성

### 모호한 상황 처리

- **Firebase vs Netlify 충돌**: Netlify 프론트엔드, Firebase Functions 백엔드 유지
- **스타일링 선택**: 항상 Tailwind CSS 우선, 커스텀 CSS 최소화
- **API 처리**: 직접 호출보다 Firebase Functions 경유 선택

## 금지 사항

### ❌ 절대 금지

- 클라이언트에서 YouTube API 직접 호출
- Firebase 환경 변수를 코드에 하드코딩
- Tailwind를 무시한 인라인 스타일 사용
- 컴포넌트 내부에서 직접 API 호출 (서비스 레이어 우회)

### ❌ 구조적 금지

- `src/components/` 외부에 컴포넌트 파일 배치
- Firebase Functions 없이 YouTube 기능 구현
- TypeScript 타입 정의 생략
- 반응형 설계 무시한 고정 크기 레이아웃

### ❌ 배포 관련 금지

- Netlify에 Firebase Functions 포함 시도
- 환경 변수 없이 빌드 진행
- SPA 리다이렉트 설정 생략
- 한국 리전 외의 Firebase 리전 사용

## 성능 최적화 표준

### 필수 최적화

- **코드 스플리팅**: React.lazy() 활용
- **메모이제이션**: React.memo() 적절히 사용
- **이미지 최적화**: Tailwind 반응형 이미지 클래스 사용
- **번들 분석**: 불필요한 라이브러리 제거

### 모니터링 설정

- **Sentry**: 에러 추적 필수 설정
- **Web Vitals**: 성능 메트릭 수집
- **Firebase Analytics**: 사용자 행동 분석

---

**⚠️ 중요**: 이 문서의 모든 규칙은 Netlify 배포 환경 최적화를 위해 설계되었습니다. Firebase Hosting 설정과 충돌하지 않도록 주의하여 적용하세요.

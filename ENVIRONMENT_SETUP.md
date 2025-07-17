# 환경 변수 설정 가이드

## Netlify 배포를 위한 환경 변수 설정

### 필수 환경 변수

Netlify 대시보드의 **Site settings > Environment variables**에서 다음 환경 변수들을 설정하세요:

#### Firebase 설정

```bash
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
```

#### YouTube API 설정

```bash
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here
```

#### 배포 환경 설정

```bash
REACT_APP_USE_FUNCTIONS_EMULATOR=false
NODE_ENV=production
GENERATE_SOURCEMAP=false
CI=false
```

### 선택적 환경 변수

#### Sentry 에러 추적 (권장)

```bash
REACT_APP_SENTRY_DSN=your_sentry_dsn_here
```

## 로컬 개발 환경 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here

# YouTube API
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here

# 개발 환경 설정
REACT_APP_USE_FUNCTIONS_EMULATOR=true
NODE_ENV=development
GENERATE_SOURCEMAP=true
```

## 환경 변수 확인 방법

### Firebase 설정 확인

1. Firebase Console (https://console.firebase.google.com)
2. 프로젝트 선택
3. 프로젝트 설정 (톱니바퀴 아이콘)
4. **일반** 탭에서 "Firebase SDK snippet" > "구성" 선택

### YouTube API 키 확인

1. Google Cloud Console (https://console.cloud.google.com)
2. 프로젝트 선택
3. **API 및 서비스** > **사용자 인증 정보**
4. YouTube Data API v3 키 확인

## 보안 주의사항

⚠️ **중요**:

- 환경 변수 파일 (`.env*`)을 Git에 커밋하지 마세요
- Firebase API 키는 클라이언트 측에서 노출되므로 Firebase 보안 규칙으로 보호하세요
- YouTube API 키는 도메인 제한을 설정하여 보호하세요

## 배포 확인

환경 변수가 올바르게 설정되었는지 확인하려면:

1. Netlify에서 배포 후 브라우저 개발자 도구 콘솔 확인
2. Firebase 연결 오류가 없는지 확인
3. YouTube 검색 기능이 정상 작동하는지 확인

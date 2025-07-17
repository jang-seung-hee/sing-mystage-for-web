# 🚀 Firebase Functions 배포 가이드

## 개요

YouTube 스트림 URL 추출을 위한 Firebase Functions 배포 및 운영 가이드입니다.

## 📋 배포 전 체크리스트

### 1. 환경 변수 설정

```bash
# .env 파일 생성 (루트 디렉토리)
cp .env.example .env

# Firebase 프로젝트 정보 입력
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# ... 기타 Firebase 설정
```

### 2. Firebase CLI 로그인

```bash
firebase login
firebase use your-project-id
```

### 3. Functions 의존성 설치

```bash
cd functions
npm install
cd ..
```

## 🔧 배포 명령어

### Functions만 배포

```bash
npm run deploy:functions
```

### Hosting만 배포 (React 앱)

```bash
npm run deploy:hosting
```

### 전체 배포 (Functions + Hosting)

```bash
npm run deploy:all
```

## 🔍 모니터링 및 관리

### 1. 로그 확인

```bash
# 실시간 로그 스트리밍
npm run functions:logs

# 특정 함수 로그
firebase functions:log --only getStreamUrl
```

### 2. 헬스체크

Functions 배포 후 헬스체크 확인:

```javascript
// JavaScript에서 헬스체크 호출
const healthCheck = httpsCallable(functions, 'healthCheck');
const result = await healthCheck();
console.log(result.data);
```

### 3. 메트릭 모니터링

```javascript
// 시스템 메트릭 조회 (인증된 사용자)
const getMetrics = httpsCallable(functions, 'getMetrics');
const metrics = await getMetrics();
console.log(metrics.data);
```

## ⚡ 성능 최적화

### 현재 설정

- **리전**: asia-northeast3 (한국)
- **메모리**: 1GB (ytdl-core 처리용)
- **타임아웃**: 30초
- **최대 인스턴스**: 5개 (비용 관리)
- **Rate Limiting**: 분당 20회 요청

### Cold Start 최소화

- 함수가 자주 호출되지 않을 경우 Cold Start 발생 가능
- 필요시 Cloud Scheduler로 정기적 호출 설정

## 🔐 보안 기능

### 1. 인증 요구사항

- 모든 Functions는 Firebase Auth 인증 필요
- 비인증 사용자 접근 차단

### 2. Rate Limiting

- 사용자당 분당 20회 요청 제한
- 초과 시 10분간 자동 차단
- Firestore에 제한 정보 저장

### 3. CORS 설정

- localhost, firebaseapp.com, web.app 도메인만 허용
- POST 메서드만 허용

### 4. 입력 검증

- YouTube Video ID 형식 검증 (11자리 영숫자)
- 유효하지 않은 URL 차단

## 📊 운영 가이드

### 1. 비용 모니터링

Firebase Console → Functions → 사용량 확인:

- 호출 횟수
- 실행 시간
- 메모리 사용량

### 2. 에러 알림 설정

Firebase Console → Functions → 로그:

- 에러 레벨 로그 모니터링
- Cloud Monitoring 연동 권장

### 3. 백업 및 롤백

기존 외부 서비스 URL 백업:

```bash
# 환경 변수 백업
# REACT_APP_YTDLP_FUNCTION_URL=https://your-backup-service.com
```

### 4. 트러블슈팅

일반적인 문제 해결:

#### ytdl-core 에러

- YouTube 정책 변경으로 인한 오류
- 대안: 정기적 ytdl-core 업데이트

#### Rate Limit 초과

```bash
# Firestore에서 특정 사용자 제한 해제
firebase firestore:delete rateLimits/USER_UID
```

#### 성능 이슈

- Firebase Console에서 메모리/타임아웃 조정
- 최대 인스턴스 수 증가

## 🔄 롤백 절차

문제 발생 시 이전 버전으로 롤백:

1. **Functions 롤백**

```bash
firebase functions:delete getStreamUrl
# 이전 버전 재배포
```

2. **외부 서비스 복원**

```bash
# .env 파일에서 백업 URL 활성화
REACT_APP_YTDLP_FUNCTION_URL=https://your-backup-service.com
npm run deploy:hosting
```

3. **코드 롤백**

```bash
# youtubeApi.ts에서 이전 구현 복원
git checkout HEAD~1 -- src/services/youtubeApi.ts
```

## 📈 성능 벤치마크

### 예상 응답 시간

- **평균**: 2-5초
- **최대**: 30초 (타임아웃)
- **Cold Start**: +1-2초

### 처리량

- **동시 요청**: 최대 5개
- **분당 처리**: ~100회 (Rate Limit 고려)

## 📞 지원

문제 발생 시:

1. Firebase Console 로그 확인
2. 헬스체크 함수 호출
3. 메트릭 함수로 시스템 상태 확인
4. 필요시 외부 서비스로 롤백

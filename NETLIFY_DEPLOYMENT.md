# Netlify 배포 가이드

## 배포 준비 체크리스트

### 1. 환경 변수 설정

- [ ] Firebase 설정 완료 (`ENVIRONMENT_SETUP.md` 참조)
- [ ] YouTube API 키 설정
- [ ] Netlify 대시보드에서 환경 변수 등록

### 2. Firebase Functions 배포

Firebase Functions는 별도로 배포해야 합니다:

```bash
# Functions 디렉토리에서 실행
cd functions
npm install
npm run deploy
```

### 3. 빌드 테스트

로컬에서 프로덕션 빌드 테스트:

```bash
npm run build
npx serve -s build
```

## Netlify 배포 설정

### 자동 배포 설정 (권장)

1. **GitHub 연동**
   - Netlify 대시보드에서 "New site from Git" 선택
   - GitHub 저장소 연결
   - 브랜치: `main`
   - 빌드 명령: `npm run build`
   - 배포 디렉토리: `build`

2. **자동 배포 트리거**
   - `main` 브랜치 푸시 시 자동 배포
   - Pull Request 시 미리보기 배포

### 수동 배포

```bash
# 로컬 빌드 후 Netlify CLI로 배포
npm run build
netlify deploy --prod --dir=build
```

## 성능 최적화 설정

### 1. 빌드 최적화

`netlify.toml`에 이미 설정된 내용:

- Node.js 18 버전 사용
- 소스맵 비활성화 (프로덕션)
- 정적 파일 캐싱
- 보안 헤더 설정

### 2. 코드 스플리팅 확인

현재 구현된 Lazy Loading:

- `SidePanel` 컴포넌트
- `VideoPanel` 컴포넌트

### 3. 번들 크기 분석

```bash
# 번들 분석기 실행
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

## 배포 후 확인 사항

### 1. 기능 테스트

- [ ] 사용자 로그인/로그아웃
- [ ] YouTube 검색 기능
- [ ] 비디오 재생
- [ ] 즐겨찾기 추가/제거
- [ ] 최근 재생 목록

### 2. 성능 확인

- [ ] Lighthouse 점수 확인 (90+ 목표)
- [ ] 모바일 반응형 확인
- [ ] 로딩 속도 테스트

### 3. 에러 모니터링

- [ ] Sentry 에러 추적 작동 확인
- [ ] 브라우저 콘솔 에러 없음
- [ ] Network 탭에서 API 호출 정상

## 문제 해결

### 빌드 실패 시

1. **환경 변수 확인**

   ```bash
   # Netlify 빌드 로그에서 환경 변수 누락 확인
   ```

2. **의존성 문제**

   ```bash
   # 로컬에서 클린 설치
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **TypeScript 에러**
   ```bash
   # 타입 에러 확인 및 수정
   npm run lint
   npx tsc --noEmit
   ```

### 런타임 에러 시

1. **Firebase 연결 실패**
   - 환경 변수 확인
   - Firebase 프로젝트 설정 확인
   - 도메인 허용 목록 확인

2. **YouTube API 에러**
   - API 키 유효성 확인
   - 할당량 초과 여부 확인
   - Firebase Functions 상태 확인

3. **CORS 에러**
   - Firebase Functions CORS 설정 확인
   - 도메인 화이트리스트 확인

## 모니터링 및 유지보수

### 1. 성능 모니터링

- **Web Vitals**: Core Web Vitals 추적
- **Sentry**: 에러 및 성능 모니터링
- **Firebase Analytics**: 사용자 행동 분석

### 2. 정기 점검

- **월간**: 의존성 업데이트 (`npm audit`)
- **분기별**: Lighthouse 성능 점검
- **반기별**: Firebase Functions 비용 분석

### 3. 백업 및 복구

- **코드**: Git 저장소 백업
- **데이터**: Firebase 백업 설정
- **설정**: 환경 변수 문서화

## Netlify 특화 기능

### 1. Deploy Previews

- Pull Request 시 자동 미리보기
- 브랜치별 배포 URL 제공

### 2. Form Handling

현재 미사용, 필요 시 Netlify Forms 활용 가능

### 3. Edge Functions

현재 Firebase Functions 사용으로 비활성화

### 4. Analytics

Netlify Analytics 활용 가능 (유료)

## 비용 최적화

### Netlify 무료 플랜 한도

- **빌드 시간**: 월 300분
- **대역폭**: 월 100GB
- **사이트 수**: 무제한

### Firebase 비용 관리

- **Functions 호출**: 월 2백만 건 무료
- **Firestore**: 읽기/쓰기 무료 할당량 확인
- **Hosting**: 10GB 무료

### 최적화 방안

- 불필요한 API 호출 최소화
- 캐싱 전략 활용
- 번들 크기 최적화

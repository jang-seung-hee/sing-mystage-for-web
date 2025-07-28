# SingMyStage 디자인 가이드

이 폴더는 SingMyStage 프로젝트의 디자인을 HTML로 재현한 가이드입니다.

## 📁 파일 구조

```
.design_sing-mystage-for-web/
├── index.html          # 메인 디자인 가이드 페이지
├── css/               # 스타일 파일
│   └── index.css      # 원본 CSS 파일
├── js/                # JavaScript 파일
│   └── main.js        # 인터랙티브 기능
├── assets/            # 이미지 및 리소스
├── reference/         # 원본 파일 참고
│   ├── App.tsx        # 메인 앱 컴포넌트
│   └── MainPage.tsx   # 메인 페이지 컴포넌트
├── tailwind.config.js # Tailwind 설정
└── README.md          # 이 파일
```

## 🎨 색상 팔레트

### 네온 색상
- **Neon Cyan**: `#00ffff` - 주요 액센트 색상
- **Neon Pink**: `#ff00ff` - 보조 액센트 색상
- **Neon Yellow**: `#ffff00` - 경고/주의 색상
- **Neon Blue**: `#0066ff` - 정보 색상
- **Neon Green**: `#00ff66` - 성공 색상
- **Neon Purple**: `#9933ff` - 고급 색상

### 다크 테마 색상
- **Dark BG**: `#0a0a0a` - 배경색
- **Dark Card**: `#1a1a1a` - 카드 배경색
- **Dark Border**: `#333333` - 테두리 색상
- **Dark Surface**: `#0f0f0f` - 표면 색상

## ✨ 애니메이션

### 커스텀 애니메이션
- `animate-pulse-glow` - 네온 글로우 펄스 효과
- `animate-bounce-glow` - 바운스 글로우 효과
- `animate-float` - 부드러운 떠다니는 효과
- `animate-glow-pulse` - 글로우 펄스 효과
- `animate-fade-in` - 페이드 인 효과
- `animate-slide-in-left` - 왼쪽에서 슬라이드 인

### 그라디언트
- `bg-gradient-karaoke` - 노래방 테마 그라디언트
- `bg-gradient-cosmic` - 우주 테마 그라디언트
- `bg-gradient-dark` - 다크 그라디언트
- `bg-gradient-neon` - 네온 그라디언트

## 🧩 컴포넌트 스타일

### 버튼
```html
<!-- 네온 버튼 -->
<button class="bg-neon-cyan text-black px-6 py-3 rounded-lg font-bold shadow-neon-cyan hover:shadow-glow-md transition-all duration-300">
    Neon Button
</button>

<!-- 아웃라인 버튼 -->
<button class="bg-dark-card border border-neon-yellow text-neon-yellow px-6 py-3 rounded-lg font-bold shadow-neon-yellow hover:shadow-glow-md transition-all duration-300">
    Outline Button
</button>
```

### 카드
```html
<!-- 기본 카드 -->
<div class="bg-dark-card border border-dark-border p-6 rounded-lg hover:border-neon-cyan transition-all duration-300">
    <h4 class="text-neon-cyan font-bold mb-2">카드 제목</h4>
    <p class="text-gray-400">카드 내용</p>
</div>

<!-- 네온 카드 -->
<div class="bg-dark-card border border-neon-pink p-6 rounded-lg shadow-neon-pink">
    <h4 class="text-neon-pink font-bold mb-2">네온 카드</h4>
    <p class="text-gray-400">네온 효과가 적용된 카드</p>
</div>
```

### 입력 필드
```html
<input type="text" placeholder="검색어를 입력하세요..." 
       class="w-full bg-dark-card border border-dark-border text-white px-4 py-3 rounded-lg focus:border-neon-cyan focus:shadow-neon-cyan transition-all duration-300 placeholder-gray-500">
```

## 🚀 사용 방법

1. **브라우저에서 열기**: `index.html` 파일을 브라우저에서 열어 디자인을 확인
2. **색상 복사**: 색상 팔레트를 클릭하여 색상 코드를 클립보드에 복사
3. **애니메이션 제어**: 애니메이션 섹션의 요소들을 클릭하여 재생/일시정지
4. **인터랙션 체험**: 각 컴포넌트에 마우스를 올려 호버 효과 확인
5. **키보드 단축키**: 
   - `1-3`: 색상 복사
   - `D`: 다크모드 토글
   - `H`: 도움말 표시

## 🎯 디자인 특징

### 1. 네온 테마
- 밝고 선명한 네온 색상 사용
- 글로우 효과와 그림자로 입체감 표현
- 다크 배경과의 대비로 가독성 향상

### 2. 반응형 디자인
- 모바일부터 데스크톱까지 모든 화면 크기 지원
- 터치 친화적인 인터페이스
- 유연한 그리드 시스템

### 3. 성능 최적화
- CSS 애니메이션 사용으로 부드러운 전환
- 하드웨어 가속 활용
- 모바일에서 애니메이션 성능 최적화

### 4. 접근성
- 고대비 색상 조합
- 키보드 네비게이션 지원
- 스크린 리더 호환성

## 🔧 커스터마이징

### 색상 변경
`tailwind.config.js` 파일에서 색상 값을 수정하여 테마를 변경할 수 있습니다.

### 애니메이션 조정
CSS 파일에서 키프레임 애니메이션의 지속 시간과 효과를 조정할 수 있습니다.

### 새로운 컴포넌트 추가
기존 스타일을 참고하여 새로운 컴포넌트를 추가할 수 있습니다.

## 📱 모바일 최적화

- 터치 타겟 크기 최적화 (최소 44px)
- 스와이프 제스처 지원
- 모바일에서 애니메이션 성능 최적화
- 반응형 레이아웃

## 🎨 디자인 시스템

### 타이포그래피
- 기본 폰트: 시스템 폰트 스택
- 제목: Bold, 24px 이상
- 본문: Regular, 16px
- 캡션: Light, 14px

### 간격
- 기본 간격: 4px (0.25rem)
- 섹션 간격: 48px (3rem)
- 컴포넌트 간격: 16px (1rem)

### 둥근 모서리
- 작은 요소: 4px (0.25rem)
- 카드: 8px (0.5rem)
- 버튼: 8px (0.5rem)
- 모달: 12px (0.75rem)

## 🔍 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 업데이트 기록

- **2025-07-25**: 초기 디자인 가이드 생성
- 네온 테마 색상 팔레트 정의
- 커스텀 애니메이션 추가
- 반응형 레이아웃 구현
- 인터랙티브 기능 추가

## 🤝 기여하기

디자인 가이드를 개선하려면:

1. 새로운 컴포넌트 스타일 추가
2. 색상 팔레트 확장
3. 애니메이션 효과 개선
4. 접근성 향상
5. 성능 최적화

## 📄 라이선스

이 디자인 가이드는 SingMyStage 프로젝트의 일부입니다.

---

**생성일**: 2025-07-25  
**버전**: 1.0.0  
**작성자**: SingMyStage Team 
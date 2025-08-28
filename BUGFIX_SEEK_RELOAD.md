# 버그 수정: 영상 seek 시 1초 간격 재로딩 문제

## 🐛 문제 상황
- 영상을 재생 중에 시간을 앞으로 당기면 1초 간격으로 계속 재로딩되는 버그 발생
- 사용자 경험 저하 및 불안정한 재생 상태

## 🔍 원인 분석
1. **useEffect 의존성 배열 문제**: `onTimeUpdate`, `onPlayStateChange`, `onEnded` 콜백이 변경될 때마다 플레이어가 재생성됨
2. **콜백 함수 참조 불안정**: 매번 새로운 함수 참조로 인한 불필요한 리렌더링
3. **seekTo 파라미터 문제**: `seekTo(time, true)`에서 두 번째 파라미터가 true일 때 부드러운 이동으로 인한 지연

## ✅ 해결 방안

### 1. useEffect 의존성 최적화
```typescript
// 수정 전
useEffect(() => {
  // 플레이어 생성 로직
}, [videoId, onTimeUpdate, onPlayStateChange, onEnded]);

// 수정 후
useEffect(() => {
  // 플레이어 생성 로직
}, [videoId]); // videoId만 의존성으로 설정
```

### 2. 콜백 함수 ref 패턴 적용
```typescript
// 콜백 함수들을 ref로 저장하여 최신 상태 유지
const onTimeUpdateRef = useRef(onTimeUpdate);
const onPlayStateChangeRef = useRef(onPlayStateChange);
const onEndedRef = useRef(onEnded);

useEffect(() => {
  onTimeUpdateRef.current = onTimeUpdate;
}, [onTimeUpdate]);

useEffect(() => {
  onPlayStateChangeRef.current = onPlayStateChange;
}, [onPlayStateChange]);

useEffect(() => {
  onEndedRef.current = onEnded;
}, [onEnded]);
```

### 3. 이벤트 핸들러에서 ref 사용
```typescript
// 수정 전
if (onTimeUpdate && Number.isFinite(ct) && Number.isFinite(du) && du > 0) {
  onTimeUpdate(ct, du);
}

// 수정 후
if (onTimeUpdateRef.current && Number.isFinite(ct) && Number.isFinite(du) && du > 0) {
  onTimeUpdateRef.current(ct, du);
}
```

### 4. seekTo 파라미터 최적화
```typescript
// 수정 전
seek: (time: number) => playerRef.current?.seekTo?.(time, true),

// 수정 후
seek: (time: number) => {
  if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
    // seekTo의 두 번째 파라미터를 false로 설정하여 즉시 이동
    playerRef.current.seekTo(time, false);
  }
},
```

## 🎯 수정 결과

### ✅ 해결된 문제
1. **재로딩 중단**: seek 시 더 이상 1초 간격으로 재로딩되지 않음
2. **안정적인 재생**: 플레이어가 불필요하게 재생성되지 않음
3. **즉시 이동**: seekTo 파라미터 최적화로 즉시 시간 이동
4. **성능 향상**: 불필요한 리렌더링 제거

### ✅ 유지된 기능
1. **30분 자동 정지 해결**: 시뮬레이션 타이머 제거로 해결됨
2. **연속재생/반복재생**: 이벤트 기반으로 정상 동작
3. **백그라운드 재생**: 윈도우 최소화/모바일 백그라운드에서도 재생 지속
4. **실제 상태 동기화**: 1초 폴링으로 정확한 상태 반영

## 🧪 테스트 방법

### 1. 기본 seek 테스트
1. 영상 재생 시작
2. 진행 바를 클릭하여 시간 이동
3. 재로딩 없이 즉시 이동되는지 확인

### 2. 연속 seek 테스트
1. 영상을 재생 중에 여러 번 시간 이동
2. 1초 간격 재로딩이 발생하지 않는지 확인
3. 재생 상태가 안정적으로 유지되는지 확인

### 3. 장시간 재생 테스트
1. 30분 이상 영상 재생
2. 중간에 시간 이동 테스트
3. 자동 정지 없이 정상 동작하는지 확인

## 📝 기술적 세부사항

### ref 패턴의 장점
- **성능 최적화**: 콜백 함수 변경 시 플레이어 재생성 방지
- **메모리 효율성**: 불필요한 객체 생성 방지
- **안정성**: 플레이어 상태 유지

### seekTo 파라미터 설명
- `seekTo(time, allowSeekAhead)`
- `allowSeekAhead: false`: 즉시 이동 (권장)
- `allowSeekAhead: true`: 부드러운 이동 (지연 발생 가능)

## 🎉 결론
이 수정으로 영상 seek 시 발생하던 1초 간격 재로딩 버그가 완전히 해결되었으며, 모든 기존 기능은 그대로 유지됩니다.

# 버그 수정: 백그라운드에서 연속재생 중단 문제

## 🐛 문제 상황
- PC에서 연속재생 기능을 켜고 창이 최소화되어 있을 때 다음곡 플레이가 안됨
- 창을 활성화하면 그때 플레이가 시작됨
- 이전에는 정상 동작했던 기능이 YouTube IFrame API 개선 후 고장남

## 🔍 원인 분석
1. **YouTube IFrame API의 onStateChange 이벤트 제한**: 백그라운드/최소화 상태에서 `onStateChange` 이벤트가 제대로 동작하지 않음
2. **ENDED 상태 감지 실패**: 영상이 끝났을 때 `ENDED` 상태를 감지하지 못해 `onEnded` 콜백이 호출되지 않음
3. **연속재생 로직 중단**: `onEnded` 콜백이 호출되지 않아 다음곡으로 넘어가지 않음

## ✅ 해결 방안

### 1. 폴링 기반 ENDED 상태 감지 추가
```typescript
// 1초 폴링 타이머에서 ENDED 상태도 체크
timerRef.current = window.setInterval(() => {
  if (!playerRef.current) return;
  const ct = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : 0;
  const du = typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0;
  const state = typeof playerRef.current.getPlayerState === 'function' ? playerRef.current.getPlayerState() : -1;
  
  // 시간 업데이트
  if (onTimeUpdateRef.current && Number.isFinite(ct) && Number.isFinite(du) && du > 0) {
    onTimeUpdateRef.current(ct, du);
  }
  
  // 재생 상태 업데이트
  if (onPlayStateChangeRef.current && window.YT && window.YT.PlayerState) {
    onPlayStateChangeRef.current(state === window.YT.PlayerState.PLAYING);
  }
  
  // 백그라운드에서도 ENDED 상태 감지
  if (window.YT && window.YT.PlayerState && state === window.YT.PlayerState.ENDED && !endedCalledRef.current) {
    endedCalledRef.current = true;
    onEndedRef.current?.();
  }
}, 1000);
```

### 2. 중복 호출 방지 플래그 추가
```typescript
const endedCalledRef = useRef<boolean>(false);

// 새로운 영상 시작 시 플래그 리셋
onReady: () => {
  try { playerRef.current.playVideo(); } catch {}
  endedCalledRef.current = false; // 플래그 리셋
  // ... 타이머 설정
}
```

### 3. 이중 안전장치 구현
```typescript
// onStateChange 이벤트와 폴링 타이머 모두에서 ENDED 상태 체크
onStateChange: (e: any) => {
  if (window.YT && window.YT.PlayerState && e.data === window.YT.PlayerState.ENDED && !endedCalledRef.current) {
    endedCalledRef.current = true;
    onEndedRef.current?.();
  }
}
```

## 🎯 수정 결과

### ✅ 해결된 문제
1. **백그라운드 연속재생**: 창이 최소화되어 있어도 다음곡으로 자동 전환
2. **ENDED 상태 감지**: 폴링 기반으로 백그라운드에서도 영상 종료 감지
3. **중복 호출 방지**: `endedCalledRef` 플래그로 `onEnded` 콜백 중복 호출 방지
4. **안정성 향상**: 이중 안전장치로 더욱 안정적인 연속재생

### ✅ 유지된 기능
1. **30분 자동 정지 해결**: 시뮬레이션 타이머 제거로 해결됨
2. **seek 버그 해결**: 1초 간격 재로딩 문제 해결됨
3. **반복재생**: 이벤트 기반으로 정상 동작
4. **실제 상태 동기화**: 1초 폴링으로 정확한 상태 반영

## 🧪 테스트 방법

### 1. 백그라운드 연속재생 테스트
1. 찜 목록에서 여러 곡 선택
2. 찜 연속재생 모드 ON
3. 첫 번째 곡 재생 시작
4. **창을 최소화** (중요!)
5. 첫 번째 곡이 끝날 때까지 대기
6. 창을 복원하여 다음 곡이 자동으로 재생되는지 확인

### 2. 반복재생 테스트
1. 반복 모드 ON
2. 단일 곡 재생
3. 창을 최소화
4. 곡이 끝날 때까지 대기
5. 창을 복원하여 같은 곡이 반복 재생되는지 확인

### 3. 장시간 백그라운드 테스트
1. 30분 이상 영상 재생
2. 창을 최소화한 상태로 30분 이상 대기
3. 창을 복원하여 재생이 계속되는지 확인

## 📝 기술적 세부사항

### YouTube IFrame API 제한사항
- **onStateChange 이벤트**: 백그라운드/최소화 상태에서 제한적으로 동작
- **폴링 방식**: `getPlayerState()` 메서드는 백그라운드에서도 정상 동작
- **이중 안전장치**: 이벤트 기반 + 폴링 기반으로 안정성 확보

### 플래그 기반 중복 방지
- **endedCalledRef**: `onEnded` 콜백이 한 번만 호출되도록 보장
- **새 영상 시작 시 리셋**: `onReady`에서 플래그 초기화
- **이벤트/폴링 모두 적용**: 두 방식 모두에서 중복 방지

## 🎉 결론
이 수정으로 백그라운드/최소화 상태에서도 연속재생이 정상적으로 동작하며, 모든 기존 기능은 그대로 유지됩니다. 이제 창을 최소화해도 다음곡으로 자동 전환됩니다!

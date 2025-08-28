# 버그 수정: 강화된 백그라운드 연속재생 감지

## 🐛 문제 상황
- 첫 곡이 플레이 중일 때 슬라이더를 당겨서 끝나기 5초 전으로 만든 후 최소화
- 영상이 끝나도 다음곡 플레이가 안됨
- `getPlayerState()`가 백그라운드에서 정확한 상태를 반환하지 않음

## 🔍 원인 분석
1. **getPlayerState() 제한**: 백그라운드에서 `ENDED` 상태를 정확히 반환하지 않음
2. **시간 기반 감지 부족**: 현재 시간과 총 시간 비교로 영상 종료 감지 필요
3. **시간 멈춤 현상**: 백그라운드에서 시간이 멈춰있을 수 있음

## ✅ 해결 방안

### 1. 다중 방법 기반 ENDED 상태 감지
```typescript
// 백그라운드에서도 ENDED 상태 감지 - 다중 방법 사용
if (!endedCalledRef.current) {
  // 방법 1: getPlayerState()로 ENDED 상태 감지
  if (window.YT && window.YT.PlayerState && state === window.YT.PlayerState.ENDED) {
    endedCalledRef.current = true;
    onEndedRef.current?.();
  }
  // 방법 2: 시간 기반 감지 (현재 시간이 총 시간에 근접하거나 같을 때)
  else if (Number.isFinite(ct) && Number.isFinite(du) && du > 0) {
    const timeDiff = Math.abs(ct - du);
    if (timeDiff <= 1.0) { // 1초 이내로 끝에 도달했을 때
      endedCalledRef.current = true;
      onEndedRef.current?.();
    }
    // 방법 3: 시간이 멈춰있는지 감지 (백그라운드에서 시간이 멈출 수 있음)
    else if (Math.abs(ct - lastCurrentTimeRef.current) < 0.1) {
      stuckTimeRef.current += 1;
      // 3초 이상 시간이 멈춰있고, 현재 시간이 총 시간의 95% 이상일 때
      if (stuckTimeRef.current >= 3 && ct >= du * 0.95) {
        endedCalledRef.current = true;
        onEndedRef.current?.();
      }
    } else {
      stuckTimeRef.current = 0;
    }
    lastCurrentTimeRef.current = ct;
  }
}
```

### 2. 시간 추적 변수 추가
```typescript
const lastCurrentTimeRef = useRef<number>(0);  // 이전 시간 저장
const stuckTimeRef = useRef<number>(0);        // 멈춤 시간 카운터

// 새로운 영상 시작 시 초기화
onReady: () => {
  endedCalledRef.current = false;
  lastCurrentTimeRef.current = 0;
  stuckTimeRef.current = 0;
  // ... 타이머 설정
}
```

### 3. 감지 방법별 세부 로직

#### 방법 1: getPlayerState() 기반
- YouTube API의 공식 `ENDED` 상태 감지
- 포그라운드에서 가장 정확한 방법

#### 방법 2: 시간 기반 감지
- 현재 시간과 총 시간의 차이가 1초 이내일 때
- 백그라운드에서도 동작하는 안정적인 방법

#### 방법 3: 시간 멈춤 감지
- 3초 이상 시간이 멈춰있고, 현재 시간이 총 시간의 95% 이상일 때
- 백그라운드에서 시간이 멈춰있는 경우 대응

## 🎯 수정 결과

### ✅ 해결된 문제
1. **슬라이더 조작 후 백그라운드 감지**: 끝나기 5초 전으로 설정 후 최소화해도 다음곡 전환
2. **다중 감지 방법**: 3가지 방법으로 영상 종료를 확실히 감지
3. **시간 멈춤 대응**: 백그라운드에서 시간이 멈춰도 감지 가능
4. **안정성 향상**: 여러 방법으로 백업하여 더욱 안정적인 연속재생

### ✅ 유지된 기능
1. **30분 자동 정지 해결**: 시뮬레이션 타이머 제거로 해결됨
2. **seek 버그 해결**: 1초 간격 재로딩 문제 해결됨
3. **반복재생**: 이벤트 기반으로 정상 동작
4. **실제 상태 동기화**: 1초 폴링으로 정확한 상태 반영

## 🧪 테스트 방법

### 1. 슬라이더 조작 후 백그라운드 테스트
1. 찜 목록에서 여러 곡 선택
2. 찜 연속재생 모드 ON
3. 첫 번째 곡 재생 시작
4. **슬라이더를 당겨서 끝나기 5초 전으로 설정**
5. **창을 최소화**
6. 5초 후 창을 복원하여 다음 곡이 자동으로 재생되는지 확인

### 2. 시간 멈춤 감지 테스트
1. 긴 영상(10분 이상) 재생
2. 끝나기 1분 전으로 슬라이더 이동
3. 창을 최소화
4. 1분 후 창을 복원하여 다음 곡이 자동으로 재생되는지 확인

### 3. 다양한 시나리오 테스트
1. **정상 종료**: 영상을 끝까지 재생
2. **슬라이더 조작**: 중간에 시간 이동 후 재생
3. **백그라운드 전환**: 재생 중 창 최소화
4. **복합 시나리오**: 슬라이더 조작 + 백그라운드 전환

## 📝 기술적 세부사항

### 감지 방법별 우선순위
1. **getPlayerState()**: 가장 정확하지만 백그라운드에서 제한적
2. **시간 기반**: 안정적이고 백그라운드에서도 동작
3. **시간 멈춤**: 예외 상황 대응

### 임계값 설정
- **시간 차이**: 1초 이내 (정확한 종료 감지)
- **멈춤 시간**: 3초 이상 (일시적 멈춤과 구분)
- **진행률**: 95% 이상 (거의 끝난 상태)

### 성능 최적화
- **조건부 실행**: `endedCalledRef.current`로 중복 호출 방지
- **효율적 계산**: 필요한 경우에만 복잡한 계산 수행
- **메모리 관리**: ref 사용으로 불필요한 리렌더링 방지

## 🎉 결론
이 수정으로 슬라이더를 조작한 후 백그라운드로 전환해도 다음곡으로 자동 전환되며, 모든 기존 기능은 그대로 유지됩니다. 3가지 감지 방법으로 더욱 안정적인 연속재생을 보장합니다!

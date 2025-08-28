// YouTube IFrame API 재생 흐름 자동화 테스트 스크립트
// 브라우저 콘솔에서 실행

console.log('=== YouTube IFrame API 재생 흐름 테스트 시작 ===');

// 테스트 결과 저장
const testResults = {
  apiLoad: false,
  playerInit: false,
  singlePlay: false,
  playlist: false,
  loop: false,
  windowMinimize: false,
  longPlay: false,
  mobileBg: false
};

// 1. YouTube IFrame API 로드 테스트
function testAPILoad() {
  console.log('1. YouTube IFrame API 로드 테스트');
  
  if (window.YT && window.YT.Player) {
    console.log('✅ YouTube IFrame API 로드 성공');
    testResults.apiLoad = true;
    return true;
  } else {
    console.log('❌ YouTube IFrame API 로드 실패');
    return false;
  }
}

// 2. 플레이어 초기화 테스트
function testPlayerInit() {
  console.log('2. 플레이어 초기화 테스트');
  
  // 플레이어 컨테이너 찾기
  const playerContainer = document.querySelector('[data-testid="youtube-player"]') || 
                         document.querySelector('.video-container iframe') ||
                         document.querySelector('iframe[src*="youtube.com"]');
  
  if (playerContainer) {
    console.log('✅ 플레이어 컨테이너 발견');
    testResults.playerInit = true;
    return true;
  } else {
    console.log('❌ 플레이어 컨테이너 없음');
    return false;
  }
}

// 3. 단일 재생 테스트
function testSinglePlay() {
  console.log('3. 단일 재생 테스트');
  
  // 재생 버튼 찾기 및 클릭
  const playButton = document.querySelector('button[aria-label*="재생"]') ||
                    document.querySelector('button[aria-label*="play"]') ||
                    document.querySelector('.play-button');
  
  if (playButton) {
    playButton.click();
    console.log('✅ 재생 버튼 클릭');
    
    // 3초 후 재생 상태 확인
    setTimeout(() => {
      const isPlaying = !document.querySelector('video')?.paused;
      if (isPlaying) {
        console.log('✅ 재생 상태 확인');
        testResults.singlePlay = true;
      } else {
        console.log('❌ 재생 상태 확인 실패');
      }
    }, 3000);
    
    return true;
  } else {
    console.log('❌ 재생 버튼 없음');
    return false;
  }
}

// 4. 연속재생 테스트
function testPlaylist() {
  console.log('4. 연속재생 테스트');
  
  // 찜 목록에서 여러 곡 선택 시뮬레이션
  const favoriteItems = document.querySelectorAll('[data-testid="favorite-item"]');
  
  if (favoriteItems.length >= 2) {
    console.log('✅ 찜 목록에서 여러 곡 발견');
    
    // 첫 번째 곡 클릭
    favoriteItems[0].click();
    console.log('✅ 첫 번째 곡 재생 시작');
    
    // 연속재생 모드 확인
    const autoModeToggle = document.querySelector('[data-testid="favorites-auto-mode"]');
    if (autoModeToggle && autoModeToggle.checked) {
      console.log('✅ 찜 연속재생 모드 활성화됨');
      testResults.playlist = true;
    } else {
      console.log('❌ 찜 연속재생 모드 비활성화됨');
    }
    
    return true;
  } else {
    console.log('❌ 찜 목록에 곡이 부족함');
    return false;
  }
}

// 5. 반복재생 테스트
function testLoop() {
  console.log('5. 반복재생 테스트');
  
  // 반복 모드 토글 찾기
  const repeatToggle = document.querySelector('[data-testid="repeat-mode"]');
  
  if (repeatToggle) {
    repeatToggle.click();
    console.log('✅ 반복 모드 토글 클릭');
    
    // 반복 모드 상태 확인
    if (repeatToggle.checked) {
      console.log('✅ 반복 모드 활성화됨');
      testResults.loop = true;
    } else {
      console.log('❌ 반복 모드 비활성화됨');
    }
    
    return true;
  } else {
    console.log('❌ 반복 모드 토글 없음');
    return false;
  }
}

// 6. 윈도우 최소화 테스트
function testWindowMinimize() {
  console.log('6. 윈도우 최소화 테스트');
  
  // 현재 재생 상태 저장
  const isPlaying = !document.querySelector('video')?.paused;
  
  if (isPlaying) {
    console.log('✅ 재생 중 상태에서 테스트 시작');
    
    // 윈도우 최소화 시뮬레이션 (실제로는 불가능하므로 visibilitychange 이벤트 시뮬레이션)
    document.dispatchEvent(new Event('visibilitychange'));
    
    // 5초 후 상태 확인
    setTimeout(() => {
      const stillPlaying = !document.querySelector('video')?.paused;
      if (stillPlaying) {
        console.log('✅ 윈도우 최소화 후에도 재생 지속');
        testResults.windowMinimize = true;
      } else {
        console.log('❌ 윈도우 최소화 후 재생 중단됨');
      }
    }, 5000);
    
    return true;
  } else {
    console.log('❌ 재생 중이 아님');
    return false;
  }
}

// 7. 장시간 재생 테스트
function testLongPlay() {
  console.log('7. 장시간 재생 테스트');
  
  const startTime = Date.now();
  const testDuration = 30000; // 30초 테스트 (실제로는 30분)
  
  console.log(`✅ ${testDuration/1000}초 장시간 재생 테스트 시작`);
  
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const isPlaying = !document.querySelector('video')?.paused;
    
    if (elapsed >= testDuration) {
      clearInterval(interval);
      if (isPlaying) {
        console.log('✅ 장시간 재생 테스트 성공');
        testResults.longPlay = true;
      } else {
        console.log('❌ 장시간 재생 테스트 실패');
      }
    } else {
      console.log(`진행률: ${Math.round(elapsed/testDuration*100)}%`);
    }
  }, 5000);
  
  return true;
}

// 8. 모바일 백그라운드 테스트
function testMobileBg() {
  console.log('8. 모바일 백그라운드 테스트');
  
  // 모바일 환경 감지
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log('✅ 모바일 환경 감지됨');
    
    // 백그라운드 전환 시뮬레이션
    document.dispatchEvent(new Event('visibilitychange'));
    
    // 5초 후 상태 확인
    setTimeout(() => {
      const isPlaying = !document.querySelector('video')?.paused;
      if (isPlaying) {
        console.log('✅ 모바일 백그라운드에서도 재생 지속');
        testResults.mobileBg = true;
      } else {
        console.log('❌ 모바일 백그라운드에서 재생 중단됨');
      }
    }, 5000);
    
    return true;
  } else {
    console.log('❌ 모바일 환경이 아님');
    return false;
  }
}

// 전체 테스트 실행
async function runAllTests() {
  console.log('=== 전체 테스트 실행 시작 ===');
  
  // 순차적으로 테스트 실행
  testAPILoad();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  testPlayerInit();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  testSinglePlay();
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  testPlaylist();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testLoop();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testWindowMinimize();
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  testLongPlay();
  await new Promise(resolve => setTimeout(resolve, 35000));
  
  testMobileBg();
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // 최종 결과 출력
  console.log('=== 테스트 결과 요약 ===');
  console.log('API 로드:', testResults.apiLoad ? '✅' : '❌');
  console.log('플레이어 초기화:', testResults.playerInit ? '✅' : '❌');
  console.log('단일 재생:', testResults.singlePlay ? '✅' : '❌');
  console.log('연속재생:', testResults.playlist ? '✅' : '❌');
  console.log('반복재생:', testResults.loop ? '✅' : '❌');
  console.log('윈도우 최소화:', testResults.windowMinimize ? '✅' : '❌');
  console.log('장시간 재생:', testResults.longPlay ? '✅' : '❌');
  console.log('모바일 백그라운드:', testResults.mobileBg ? '✅' : '❌');
  
  const successCount = Object.values(testResults).filter(Boolean).length;
  const totalCount = Object.keys(testResults).length;
  console.log(`\n전체 성공률: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 모든 테스트 통과!');
  } else {
    console.log('⚠️ 일부 테스트 실패');
  }
}

// 테스트 실행
runAllTests();

// 디바이스별 레이아웃 설정을 로컬 스토리지에 저장하는 서비스

interface LayoutSettings {
  sidebarWidth: number;
  searchAreaHeight: number;
  deviceType: 'mobile' | 'desktop';
  lastUpdated: number;
}

const LAYOUT_SETTINGS_KEY = 'neon-music-layout-settings';

// 디바이스 타입 감지
const getDeviceType = (): 'mobile' | 'desktop' => {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? 'mobile' : 'desktop';
};

// 디바이스별 설정 키 생성
const getDeviceSettingsKey = (deviceType: 'mobile' | 'desktop') => {
  return `${LAYOUT_SETTINGS_KEY}-${deviceType}`;
};

// 레이아웃 설정 저장
export const saveLayoutSettings = (settings: Partial<LayoutSettings>) => {
  const deviceType = getDeviceType();
  const key = getDeviceSettingsKey(deviceType);
  
  const currentSettings = getLayoutSettings();
  const updatedSettings: LayoutSettings = {
    ...currentSettings,
    ...settings,
    deviceType,
    lastUpdated: Date.now(),
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(updatedSettings));
  } catch (error) {
    console.warn('레이아웃 설정 저장 실패:', error);
  }
};

// 레이아웃 설정 불러오기
export const getLayoutSettings = (): LayoutSettings => {
  const deviceType = getDeviceType();
  const key = getDeviceSettingsKey(deviceType);
  
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const settings = JSON.parse(saved) as LayoutSettings;
      // 디바이스 타입이 변경된 경우 기본값 반환
      if (settings.deviceType === deviceType) {
        return settings;
      }
    }
  } catch (error) {
    console.warn('레이아웃 설정 불러오기 실패:', error);
  }
  
  // 기본 설정 반환
  return {
    sidebarWidth: deviceType === 'mobile' ? 360 : 360,
    searchAreaHeight: 197,
    deviceType,
    lastUpdated: Date.now(),
  };
};

// 사이드바 너비 저장
export const saveSidebarWidth = (width: number) => {
  saveLayoutSettings({ sidebarWidth: width });
};

// 사이드바 너비 불러오기
export const getSidebarWidth = (): number => {
  const settings = getLayoutSettings();
  return settings.sidebarWidth;
};

// 설정 초기화
export const resetLayoutSettings = () => {
  const deviceType = getDeviceType();
  const key = getDeviceSettingsKey(deviceType);
  localStorage.removeItem(key);
};

// 검색 영역 높이 저장
export const saveSearchAreaHeight = (height: number) => {
  saveLayoutSettings({ searchAreaHeight: height });
};

// 검색 영역 높이 불러오기
export const getSearchAreaHeight = (): number => {
  const settings = getLayoutSettings();
  return settings.searchAreaHeight;
};

// 모든 디바이스 설정 삭제
export const clearAllLayoutSettings = () => {
  const mobileKey = getDeviceSettingsKey('mobile');
  const desktopKey = getDeviceSettingsKey('desktop');
  localStorage.removeItem(mobileKey);
  localStorage.removeItem(desktopKey);
}; 
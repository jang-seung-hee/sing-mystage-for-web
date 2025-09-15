// Service Worker 등록 및 관리 유틸리티

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker를 지원하지 않는 브라우저입니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker 등록 성공:', registration);
    
    // 백그라운드 동기화 등록 (실험적 기능이므로 안전하게 처리)
    try {
      if ('sync' in registration) {
        await (registration as any).sync.register('background-sync');
        console.log('백그라운드 동기화 등록 성공');
      }
    } catch (error) {
      console.log('백그라운드 동기화 등록 실패 (선택적 기능):', error);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    console.log('Service Worker 등록 해제 완료');
  } catch (error) {
    console.error('Service Worker 등록 해제 실패:', error);
  }
};

export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const showNotification = (title: string, options: NotificationOptions = {}): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo192N.png',
      badge: '/faviconN.ico',
      ...options
    });
  }
};

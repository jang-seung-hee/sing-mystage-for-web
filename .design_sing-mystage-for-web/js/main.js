// SingMyStage 디자인 가이드 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎤 SingMyStage 디자인 가이드 로드됨');
    
    // 색상 팔레트 클릭 시 색상 코드 복사
    const colorPalette = document.querySelectorAll('.bg-neon-cyan, .bg-neon-pink, .bg-neon-yellow, .bg-neon-blue, .bg-neon-green, .bg-neon-purple');
    
    colorPalette.forEach(color => {
        color.addEventListener('click', function() {
            const colorText = this.querySelector('div:last-child').textContent;
            navigator.clipboard.writeText(colorText).then(() => {
                showToast(`색상 코드 복사됨: ${colorText}`);
            });
        });
        
        // 호버 효과 추가
        color.style.cursor = 'pointer';
        color.title = '클릭하여 색상 코드 복사';
    });
    
    // 버튼 호버 효과
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // 입력 필드 포커스 효과
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // 카드 호버 효과
    const cards = document.querySelectorAll('.bg-dark-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('shadow-neon-pink')) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 10px 25px rgba(0, 255, 255, 0.2)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
    
    // 토스트 메시지 함수
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-neon-cyan text-black px-4 py-2 rounded-lg shadow-neon-cyan z-50 animate-fade-in';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
    
    // 다크 모드 토글 (예시)
    const darkModeToggle = document.createElement('button');
    darkModeToggle.className = 'fixed bottom-4 left-4 bg-dark-card border border-neon-purple text-neon-purple px-4 py-2 rounded-lg shadow-neon-purple hover:shadow-glow-md transition-all duration-300';
    darkModeToggle.textContent = '🌙';
    darkModeToggle.title = '다크 모드 토글 (예시)';
    
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        this.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
        showToast(document.body.classList.contains('dark') ? '다크 모드 활성화' : '라이트 모드 활성화');
    });
    
    document.body.appendChild(darkModeToggle);
    
    // 애니메이션 섹션 인터랙션
    const animationCards = document.querySelectorAll('.animate-pulse-glow, .animate-bounce-glow, .animate-float, .animate-glow-pulse');
    animationCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.animationPlayState = this.style.animationPlayState === 'paused' ? 'running' : 'paused';
            showToast(this.style.animationPlayState === 'paused' ? '애니메이션 일시정지' : '애니메이션 재생');
        });
        
        card.style.cursor = 'pointer';
        card.title = '클릭하여 애니메이션 제어';
    });
    
    // 그라디언트 섹션 호버 효과
    const gradients = document.querySelectorAll('.bg-gradient-karaoke, .bg-gradient-cosmic');
    gradients.forEach(gradient => {
        gradient.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.filter = 'brightness(1.1)';
        });
        
        gradient.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.filter = 'brightness(1)';
        });
    });
    
    // 레이아웃 예시 인터랙션
    const layoutItems = document.querySelectorAll('.bg-dark-surface .bg-dark-card');
    layoutItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.borderColor = '#00ffff';
            this.style.boxShadow = '0 0 10px #00ffff';
            
            setTimeout(() => {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }, 1000);
            
            showToast('레이아웃 아이템 선택됨');
        });
        
        item.style.cursor = 'pointer';
        item.title = '클릭하여 선택 효과 확인';
    });
    
    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case '1':
                document.querySelector('.bg-neon-cyan')?.click();
                break;
            case '2':
                document.querySelector('.bg-neon-pink')?.click();
                break;
            case '3':
                document.querySelector('.bg-neon-yellow')?.click();
                break;
            case 'd':
            case 'D':
                darkModeToggle.click();
                break;
            case 'h':
            case 'H':
                showToast('단축키: 1-3 (색상 복사), D (다크모드), H (도움말)');
                break;
        }
    });
    
    // 페이지 로드 완료 메시지
    setTimeout(() => {
        showToast('디자인 가이드가 준비되었습니다! 🎤');
    }, 1000);
    
    // 성능 모니터링 (개발용)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 개발 모드: 성능 모니터링 활성화');
        
        // 애니메이션 성능 체크
        let animationCount = 0;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animationCount++;
                    console.log(`🎬 애니메이션 요소 감지: ${animationCount}개`);
                }
            });
        });
        
        document.querySelectorAll('[class*="animate-"]').forEach(el => {
            observer.observe(el);
        });
    }
});

// 유틸리티 함수들
const DesignUtils = {
    // 색상 밝기 계산
    getBrightness: function(hex) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    },
    
    // 텍스트 색상 자동 결정
    getTextColor: function(bgColor) {
        const brightness = this.getBrightness(bgColor);
        return brightness > 128 ? '#000000' : '#ffffff';
    },
    
    // 네온 효과 생성
    createNeonEffect: function(color, intensity = 1) {
        return `0 0 ${5 * intensity}px ${color}, 0 0 ${10 * intensity}px ${color}, 0 0 ${15 * intensity}px ${color}`;
    }
};

// 전역 객체로 노출
window.SingMyStageDesign = {
    utils: DesignUtils,
    version: '1.0.0',
    author: 'SingMyStage Team'
}; 
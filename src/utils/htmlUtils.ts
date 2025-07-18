/**
 * HTML 유틸리티 함수들
 * HTML 엔티티 디코딩 및 태그 제거 기능
 */

/**
 * HTML 엔티티를 디코딩합니다.
 * &quot;, &amp;, &lt;, &gt;, &apos; 등을 실제 문자로 변환합니다.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 반환합니다.
 */
export function stripHtmlTags(text: string): string {
  if (!text) return text;
  
  return text.replace(/<[^>]*>/g, '');
}

/**
 * HTML 엔티티를 디코딩하고 HTML 태그를 제거합니다.
 * 가장 안전한 방법으로 텍스트를 정리합니다.
 */
export function cleanHtmlText(text: string): string {
  if (!text) return text;
  
  // 먼저 HTML 엔티티를 디코딩
  const decoded = decodeHtmlEntities(text);
  // 그 다음 HTML 태그 제거
  return stripHtmlTags(decoded);
}

/**
 * 텍스트를 안전하게 표시하기 위한 함수
 * HTML 엔티티 디코딩 + 태그 제거 + XSS 방지
 */
export function sanitizeText(text: string): string {
  if (!text) return text;
  
  // HTML 엔티티 디코딩
  let cleaned = decodeHtmlEntities(text);
  
  // HTML 태그 제거
  cleaned = stripHtmlTags(cleaned);
  
  // 추가적인 XSS 방지를 위한 문자 이스케이프
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return cleaned;
}

/**
 * 텍스트를 표시용으로 정리하는 함수 (가장 일반적으로 사용)
 * HTML 엔티티만 디코딩하고 태그는 제거하되, 특수문자는 그대로 유지
 */
export function formatDisplayText(text: string): string {
  if (!text) return text;
  
  // HTML 엔티티 디코딩
  let formatted = decodeHtmlEntities(text);
  
  // HTML 태그 제거
  formatted = stripHtmlTags(formatted);
  
  // 연속된 공백 정리
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
} 
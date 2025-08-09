/**
 * Firebase Functions 통합 테스트 유틸리티
 * YouTube 스트림 URL 추출 시스템 성능 및 기능 검증
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { getAdFreeStreamUrl, searchYouTube } from '../services/youtubeApi';

/**
 * 안전하게 오류 메시지를 추출하는 헬퍼 함수
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

// Firebase Functions 직접 호출
const healthCheckFunction = httpsCallable(functions, 'healthCheck');
const getMetricsFunction = httpsCallable(functions, 'getMetrics');
const getStreamUrlFunction = httpsCallable(functions, 'getStreamUrl');

// 테스트용 YouTube 비디오 ID 목록 (다양한 타입)
export const TEST_VIDEO_IDS = {
  // 일반 음악 비디오
  music: [
    'dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up
    'kJQP7kiw5Fk', // Luis Fonsi - Despacito
    'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
    'YQHsXMglC9A', // Adele - Hello
    'pRpeEdMmmQ0', // Shakira - Waka Waka
  ],
  // 한국 K-pop
  kpop: [
    'DDfCDBLk6ys', // BTS - Dynamite (일반적으로 안정적)
    'gdZLi9oWNZg', // BLACKPINK 관련
    'ZzBt7RdBINc', // Wonder Girls
  ],
  // 클래식/오케스트라
  classical: [
    'jGflUbPQfW8', // Beethoven's 9th Symphony
    'hKRUPYrAQoE', // Mozart
  ],
  // 잘못된/문제가 있는 비디오 ID (에러 테스트용)
  invalid: [
    'invalid123', // 잘못된 형식
    'aaaaaaaaaaa', // 존재하지 않음
    '12345678901', // 잘못된 길이
  ],
};

export interface TestResult {
  videoId: string;
  success: boolean;
  responseTime: number;
  error?: string;
  streamUrl?: string;
  videoInfo?: any;
}

export interface TestSummary {
  totalTests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  results: TestResult[];
}

/**
 * 헬스체크 함수 테스트
 */
export async function testHealthCheck(): Promise<any> {
  console.log('🏥 헬스체크 테스트 시작...');
  const startTime = Date.now();

  try {
    const result = await healthCheckFunction();
    const responseTime = Date.now() - startTime;

    console.log(`✅ 헬스체크 성공 (${responseTime}ms):`, result.data);
    return { success: true, responseTime, data: result.data };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ 헬스체크 실패 (${responseTime}ms):`, error);
    return { success: false, responseTime, error: getErrorMessage(error) };
  }
}

/**
 * 시스템 메트릭 조회 테스트
 */
export async function testGetMetrics(): Promise<any> {
  console.log('📊 메트릭 조회 테스트 시작...');
  const startTime = Date.now();

  try {
    const result = await getMetricsFunction();
    const responseTime = Date.now() - startTime;

    console.log(`✅ 메트릭 조회 성공 (${responseTime}ms):`, result.data);
    return { success: true, responseTime, data: result.data };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ 메트릭 조회 실패 (${responseTime}ms):`, error);
    return { success: false, responseTime, error: getErrorMessage(error) };
  }
}

/**
 * 단일 비디오 스트림 URL 추출 테스트
 */
export async function testSingleVideo(videoId: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const streamUrl = await getAdFreeStreamUrl(videoId);
    const responseTime = Date.now() - startTime;

    console.log(`✅ ${videoId} 성공 (${responseTime}ms)`);

    return {
      videoId,
      success: true,
      responseTime,
      streamUrl,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ ${videoId} 실패 (${responseTime}ms):`, getErrorMessage(error));

    return {
      videoId,
      success: false,
      responseTime,
      error: getErrorMessage(error),
    };
  }
}

/**
 * 다중 비디오 배치 테스트
 */
export async function testMultipleVideos(videoIds: string[]): Promise<TestSummary> {
  console.log(`🎬 ${videoIds.length}개 비디오 배치 테스트 시작...`);

  const results: TestResult[] = [];

  // 순차 테스트 (Rate Limiting 고려)
  for (const videoId of videoIds) {
    const result = await testSingleVideo(videoId);
    results.push(result);

    // Rate Limiting 방지를 위한 지연
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 통계 계산
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const successRate = (successCount / results.length) * 100;

  const responseTimes = results.map((r) => r.responseTime);
  const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  const summary: TestSummary = {
    totalTests: results.length,
    successCount,
    failureCount,
    successRate,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    results,
  };

  console.log(`📊 배치 테스트 결과:`, summary);
  return summary;
}

/**
 * 동시 요청 성능 테스트
 */
export async function testConcurrentRequests(
  videoIds: string[],
  concurrency: number = 3,
): Promise<TestSummary> {
  console.log(`⚡ ${concurrency}개 동시 요청 성능 테스트 시작...`);

  const promises = videoIds.slice(0, concurrency).map((videoId) => testSingleVideo(videoId));
  const results = await Promise.all(promises);

  // 통계 계산
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const successRate = (successCount / results.length) * 100;

  const responseTimes = results.map((r) => r.responseTime);
  const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  const summary: TestSummary = {
    totalTests: results.length,
    successCount,
    failureCount,
    successRate,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    results,
  };

  console.log(`📊 동시 요청 테스트 결과:`, summary);
  return summary;
}

/**
 * 에러 시나리오 테스트
 */
export async function testErrorScenarios(): Promise<TestSummary> {
  console.log('🚫 에러 시나리오 테스트 시작...');

  return await testMultipleVideos(TEST_VIDEO_IDS.invalid);
}

/**
 * 포괄적인 통합 테스트 실행
 */
export async function runComprehensiveTest(): Promise<{
  healthCheck: any;
  metrics: any;
  musicTest: TestSummary;
  kpopTest: TestSummary;
  classicalTest: TestSummary;
  errorTest: TestSummary;
  concurrentTest: TestSummary;
  overallSummary: {
    totalTests: number;
    successRate: number;
    averageResponseTime: number;
  };
}> {
  console.log('🔍 포괄적인 통합 테스트 시작...');

  try {
    // 1. 헬스체크 및 메트릭 테스트
    const healthCheck = await testHealthCheck();
    const metrics = await testGetMetrics();

    // 2. 카테고리별 테스트
    const musicTest = await testMultipleVideos(TEST_VIDEO_IDS.music);
    const kpopTest = await testMultipleVideos(TEST_VIDEO_IDS.kpop);
    const classicalTest = await testMultipleVideos(TEST_VIDEO_IDS.classical);

    // 3. 에러 시나리오 테스트
    const errorTest = await testErrorScenarios();

    // 4. 동시 요청 테스트
    const concurrentTest = await testConcurrentRequests(TEST_VIDEO_IDS.music, 3);

    // 전체 통계 계산
    const allTests = [musicTest, kpopTest, classicalTest];
    const totalTests = allTests.reduce((sum, test) => sum + test.totalTests, 0);
    const totalSuccess = allTests.reduce((sum, test) => sum + test.successCount, 0);
    const successRate = (totalSuccess / totalTests) * 100;

    const allResponseTimes = allTests.flatMap((test) =>
      test.results.filter((r) => r.success).map((r) => r.responseTime),
    );
    const averageResponseTime =
      allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;

    const overallSummary = {
      totalTests,
      successRate,
      averageResponseTime,
    };

    console.log('🎉 포괄적인 통합 테스트 완료!');
    console.log('📊 전체 요약:', overallSummary);

    return {
      healthCheck,
      metrics,
      musicTest,
      kpopTest,
      classicalTest,
      errorTest,
      concurrentTest,
      overallSummary,
    };
  } catch (error) {
    console.error('❌ 통합 테스트 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 테스트 결과를 보기 좋게 출력
 */
export function printTestReport(summary: TestSummary, title: string) {
  console.log(`\n📋 ${title} 테스트 보고서`);
  console.log('='.repeat(50));
  console.log(`총 테스트: ${summary.totalTests}개`);
  console.log(`성공: ${summary.successCount}개`);
  console.log(`실패: ${summary.failureCount}개`);
  console.log(`성공률: ${summary.successRate.toFixed(1)}%`);
  console.log(`평균 응답시간: ${summary.averageResponseTime.toFixed(0)}ms`);
  console.log(`최소 응답시간: ${summary.minResponseTime}ms`);
  console.log(`최대 응답시간: ${summary.maxResponseTime}ms`);
  console.log('='.repeat(50));

  // 실패한 케이스 상세 정보
  const failures = summary.results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log('\n❌ 실패한 테스트:');
    failures.forEach((failure) => {
      console.log(`  - ${failure.videoId}: ${failure.error}`);
    });
  }
}

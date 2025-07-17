import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  runComprehensiveTest,
  testHealthCheck,
  testGetMetrics,
  testSingleVideo,
  testMultipleVideos,
  testConcurrentRequests,
  testErrorScenarios,
  printTestReport,
  TEST_VIDEO_IDS,
  TestSummary,
  getErrorMessage,
} from '../utils/testUtils';
import { searchKaraoke } from '../services/youtubeApi';

interface TestResults {
  healthCheck?: any;
  metrics?: any;
  musicTest?: TestSummary;
  kpopTest?: TestSummary;
  classicalTest?: TestSummary;
  errorTest?: TestSummary;
  concurrentTest?: TestSummary;
  overallSummary?: {
    totalTests: number;
    successRate: number;
    averageResponseTime: number;
  };
}

const TestPage: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [results, setResults] = useState<TestResults>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setResults({});
  };

  // 개별 테스트 함수들
  const runHealthCheckTest = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('헬스체크');

    try {
      addLog('헬스체크 테스트 시작...');
      const result = await testHealthCheck();
      setResults((prev) => ({ ...prev, healthCheck: result }));
      addLog(`헬스체크 ${result.success ? '성공' : '실패'}: ${result.responseTime}ms`);
    } catch (error) {
      addLog(`헬스체크 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runMetricsTest = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('메트릭 조회');

    try {
      addLog('메트릭 조회 테스트 시작...');
      const result = await testGetMetrics();
      setResults((prev) => ({ ...prev, metrics: result }));
      addLog(`메트릭 조회 ${result.success ? '성공' : '실패'}: ${result.responseTime}ms`);
    } catch (error) {
      addLog(`메트릭 조회 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runSingleVideoTest = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('단일 비디오 테스트');

    try {
      const testVideoId = TEST_VIDEO_IDS.music[0]; // Rick Roll
      addLog(`단일 비디오 테스트 시작: ${testVideoId}`);
      const result = await testSingleVideo(testVideoId);
      addLog(`단일 비디오 ${result.success ? '성공' : '실패'}: ${result.responseTime}ms`);
      if (result.error) addLog(`오류: ${result.error}`);
    } catch (error) {
      addLog(`단일 비디오 테스트 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runMusicBatchTest = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('음악 배치 테스트');

    try {
      addLog('음악 비디오 배치 테스트 시작...');
      const result = await testMultipleVideos(TEST_VIDEO_IDS.music);
      setResults((prev) => ({ ...prev, musicTest: result }));
      addLog(`음악 배치 테스트 완료: ${result.successRate.toFixed(1)}% 성공률`);
    } catch (error) {
      addLog(`음악 배치 테스트 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runConcurrentTest = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('동시 요청 테스트');

    try {
      addLog('3개 동시 요청 테스트 시작...');
      const result = await testConcurrentRequests(TEST_VIDEO_IDS.music, 3);
      setResults((prev) => ({ ...prev, concurrentTest: result }));
      addLog(`동시 요청 테스트 완료: ${result.successRate.toFixed(1)}% 성공률`);
    } catch (error) {
      addLog(`동시 요청 테스트 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runErrorTest = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('에러 시나리오 테스트');

    try {
      addLog('에러 시나리오 테스트 시작...');
      const result = await testErrorScenarios();
      setResults((prev) => ({ ...prev, errorTest: result }));
      addLog(`에러 시나리오 테스트 완료: ${result.failureCount}개 에러 처리 확인`);
    } catch (error) {
      addLog(`에러 시나리오 테스트 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runComprehensiveTestSuite = async () => {
    if (!user) return;
    setIsRunning(true);
    setCurrentTest('포괄적인 통합 테스트');

    try {
      addLog('포괄적인 통합 테스트 시작... (5-10분 소요)');
      const testResults = await runComprehensiveTest();
      setResults(testResults);
      addLog(`통합 테스트 완료: ${testResults.overallSummary.successRate.toFixed(1)}% 성공률`);
      addLog(`평균 응답시간: ${testResults.overallSummary.averageResponseTime.toFixed(0)}ms`);
    } catch (error) {
      addLog(`통합 테스트 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const testKaraokeSearch = async () => {
    setIsRunning(true);
    setCurrentTest('노래방 검색 테스트');
    addLog('=== 노래방 검색 테스트 시작 ===');

    try {
      // 테스트할 검색어들
      const testQueries = ['사랑했지만 노래방', 'IU 좋은날 노래방', 'BTS 노래방'];

      for (const query of testQueries) {
        addLog(`검색 중: "${query}"`);
        const startTime = Date.now();

        const results = await searchKaraoke(query, 5);
        const responseTime = Date.now() - startTime;

        if (results && results.length > 0) {
          addLog(`✅ "${query}" 검색 성공: ${results.length}개 결과, ${responseTime}ms`);
          addLog(`  첫 번째 결과: ${results[0].snippet.title}`);
        } else {
          addLog(`❌ "${query}" 검색 실패: 결과 없음, ${responseTime}ms`);
        }

        // 연속 요청 간 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      addLog('노래방 검색 테스트 완료!');
    } catch (error) {
      addLog(`노래방 검색 테스트 오류: ${getErrorMessage(error)}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const formatTestSummary = (summary: TestSummary, title: string) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p>
            <span className="font-medium">총 테스트:</span> {summary.totalTests}개
          </p>
          <p>
            <span className="font-medium">성공:</span>{' '}
            <span className="text-green-600">{summary.successCount}개</span>
          </p>
          <p>
            <span className="font-medium">실패:</span>{' '}
            <span className="text-red-600">{summary.failureCount}개</span>
          </p>
        </div>
        <div className="space-y-2">
          <p>
            <span className="font-medium">성공률:</span> {summary.successRate.toFixed(1)}%
          </p>
          <p>
            <span className="font-medium">평균 응답시간:</span>{' '}
            {summary.averageResponseTime.toFixed(0)}ms
          </p>
          <p>
            <span className="font-medium">최대 응답시간:</span> {summary.maxResponseTime}ms
          </p>
        </div>
      </div>

      {summary.results.filter((r) => !r.success).length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded">
          <h4 className="font-medium text-red-800 mb-2">실패한 테스트:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {summary.results
              .filter((r) => !r.success)
              .map((failure, index) => (
                <li key={index}>
                  • {failure.videoId}: {failure.error}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Firebase Functions 테스트 페이지
          </h1>
          <p className="text-gray-600">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Firebase Functions 통합 테스트
          </h1>
          <p className="text-gray-600 mb-4">YouTube 스트림 URL 추출 시스템 성능 및 기능 검증</p>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-500">사용자: {user.email}</span>
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              로그 초기화
            </button>
          </div>

          {/* 테스트 버튼들 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button
              onClick={runHealthCheckTest}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
            >
              🏥 헬스체크
            </button>
            <button
              onClick={runMetricsTest}
              disabled={isRunning}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm"
            >
              📊 메트릭 조회
            </button>
            <button
              onClick={runSingleVideoTest}
              disabled={isRunning}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 text-sm"
            >
              🎵 단일 테스트
            </button>
            <button
              onClick={runMusicBatchTest}
              disabled={isRunning}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400 text-sm"
            >
              🎬 배치 테스트
            </button>
            <button
              onClick={runConcurrentTest}
              disabled={isRunning}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 text-sm"
            >
              ⚡ 동시 요청
            </button>
            <button
              onClick={runErrorTest}
              disabled={isRunning}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 text-sm"
            >
              🚫 에러 테스트
            </button>
            <button
              onClick={testKaraokeSearch}
              disabled={isRunning}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-gray-400 text-sm"
            >
              🎤 노래방 검색
            </button>
            <button
              onClick={runComprehensiveTestSuite}
              disabled={isRunning}
              className="col-span-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
            >
              🔍 전체 통합 테스트
            </button>
          </div>

          {/* 현재 실행 중인 테스트 */}
          {isRunning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">{currentTest} 실행 중...</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 로그 영역 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 실시간 로그</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto text-sm font-mono">
              {logs.length === 0 ? (
                <p className="text-gray-500">테스트를 실행하면 로그가 여기에 표시됩니다.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 결과 요약 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 테스트 결과</h2>
            <div className="h-96 overflow-y-auto">
              {results.overallSummary && (
                <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-bold text-indigo-800 mb-2">🎉 전체 요약</h3>
                  <div className="space-y-2 text-indigo-700">
                    <p>
                      <span className="font-medium">총 테스트:</span>{' '}
                      {results.overallSummary.totalTests}개
                    </p>
                    <p>
                      <span className="font-medium">성공률:</span>{' '}
                      {results.overallSummary.successRate.toFixed(1)}%
                    </p>
                    <p>
                      <span className="font-medium">평균 응답시간:</span>{' '}
                      {results.overallSummary.averageResponseTime.toFixed(0)}ms
                    </p>
                  </div>
                </div>
              )}

              {results.healthCheck && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">🏥 헬스체크</h3>
                  <p
                    className={`font-medium ${results.healthCheck.success ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {results.healthCheck.success ? '✅ 정상' : '❌ 실패'} (
                    {results.healthCheck.responseTime}ms)
                  </p>
                  {results.healthCheck.data && (
                    <pre className="text-xs mt-2 bg-blue-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(results.healthCheck.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {results.musicTest && formatTestSummary(results.musicTest, '🎵 음악 비디오 테스트')}
              {results.kpopTest && formatTestSummary(results.kpopTest, '🎤 K-pop 테스트')}
              {results.classicalTest &&
                formatTestSummary(results.classicalTest, '🎼 클래식 테스트')}
              {results.errorTest && formatTestSummary(results.errorTest, '🚫 에러 시나리오 테스트')}
              {results.concurrentTest &&
                formatTestSummary(results.concurrentTest, '⚡ 동시 요청 테스트')}

              {Object.keys(results).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  테스트를 실행하면 결과가 여기에 표시됩니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;

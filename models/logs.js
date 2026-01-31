class Log {
  constructor(rawText, aiResponse, summary = "") {
    this.rawText = rawText?.trim();       // 행정서류 원본 텍스트
    this.aiResponse = aiResponse?.trim(); // AI 서버에서 받은 분석 결과
    this.summary = summary?.trim(); // AI가 생성한 요약본이 들어갈 자리
    this.savedAt = new Date();            // 저장 시점
  }

  // 데이터 유효성 검사 (두 데이터가 모두 존재해야 함)
  isValid() {
    return (
      typeof this.rawText === 'string' && this.rawText.length > 0 &&
      typeof this.aiResponse === 'string' && this.aiResponse.length > 0
    );
  }

  // Firestore 저장용 객체 변환
  toFirestore() {
    return {
      rawText: this.rawText,
      aiResponse: this.aiResponse,
      summary: this.summary,
      savedAt: this.savedAt
    };
  }
}

module.exports = Log;

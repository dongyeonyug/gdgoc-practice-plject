const { genkit } = require('genkit');
// ❌ gemini15Flash는 이제 지원되지 않으므로 제거합니다.
const { googleAI, textEmbedding004 } = require('@genkit-ai/googleai');

const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // 현재 리스트에 2.5, 3 시리즈가 있는 것으로 보아 
      // 명시적인 버전 설정이 필요할 수 있습니다.
      apiVersion: 'v1beta' 
    }),
  ],
});

module.exports = {
  ai,
  textEmbedding004, // 임베딩 모델은 그대로 사용 가능 (004 버전)
  // 💡 특정 모델 변수 대신 모델 ID 문자열을 컨트롤러에서 직접 쓰는 것이 가장 안전합니다.
};
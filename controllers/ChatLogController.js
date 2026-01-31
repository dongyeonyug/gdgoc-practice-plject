//ai모델을 활용하기 위한 실험용 코드 입니다. 동작하지 않습니다.

"use strict";

// 1. 환경변수 로드 (최상단)
require("dotenv").config();

// const axios = require("axios");
const firestore = require("../db");
// const FormData = require("form-data"); // 파일 전송용

const Chat = require("../models/chats");
const Log = require("../models/logs");

const { Firestore } = require("@google-cloud/firestore");
// const admin = require("firebase-admin");
const { ai, textEmbedding004 } = require("../config/genkit");
// const { firestoreRetriever } = require("@genkit-ai/firebase");

const { FieldValue } = require("firebase-admin/firestore");







const addChat = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).send({ error: "질문과 답변이 누락되었습니다." });
    }

    // 질문, 답변, 시간만 깔끔하게 저장
    await firestore.collection("chats").add({
      question: question.trim(),
      answer: answer.trim(),
      createdAt: new Date() // 최신순 정렬을 위해 필수
    });

    res.status(201).send({ success: true, message: "데이터 저장 성공" });
  } catch (error) {
    console.error("AddChat Error:", error);
    res.status(500).send({ error: "저장 중 오류가 발생했습니다." });
  }
};






const getAllChat = async (req, res) => {
  try {
    // 최신순(createdAt 내림차순)으로 정렬하여 최대 50개만 호출
    const snapshot = await firestore.collection("chats")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return res.status(200).send({ data: [], message: "저장된 데이터가 없습니다." });
    }

    // 데이터 매핑
    const allData = snapshot.docs.map(doc => ({
      question: doc.data().question,
      answer: doc.data().answer,
      createdAt: doc.data().createdAt
    }));

    // 전체 데이터를 그대로 전달 (이 데이터를 Vertex AI 모델에게 통째로 넘기시면 됩니다)
    res.status(200).send({
      count: allData.length,
      data: allData
    });

  } catch (error) {
    console.error("GetAllChats Error:", error);
    res.status(500).send({ error: "데이터 호출 중 오류가 발생했습니다." });
  }
};








//유저의 질문 혹은 ai모델의답변 내역을 저장합니다.
// const addChats = async (req, res, next) => {
//   try {
//     const { role, content } = req.body;

//     const validatedChat = new Chat(role, content, new Date());

//     // 2. 가공된 객체 형태로 저장 (클래스 인스턴스를 일반 객체로 변환)
//     const dataToSave = {
//       role: validatedChat.role,
//       content: validatedChat.content,
//       timestamp: validatedChat.timestamp,
//     };

//     // Firestore와 같은 NoSQL 데이터베이스에서는 숫자를 1씩 늘리는 방식(Auto-increment)을 권장하지 않습니다. 그 이유는 여러 사용자가 동시에 질문을 할 경우 '현재 번호'가 몇 번인지 확인하고 충돌을 피하는 로직이 매우 복잡하고 성능을 떨어뜨리기 때문입니다.
//     //문서 ID를 지정하지 않기 (가장 권장)
//     // 앞서 말씀드린 .add()를 사용하면 Firestore가 7h9aX1... 같은 고유 ID를 자동으로 만듭니다.
//     // 왜 이렇게 하나요? ID가 docId1이 아니더라도, 저장된 timestamp를 기준으로 정렬하면 순서를 완벽하게 가져올 수 있기 때문입니다. 굳이 번호를 붙일 필요가 없습니다.
//     await firestore.collection("chats").add(dataToSave);

//     res.send("Record saved successfully"); // 성공 메시지를 클라이언트에 보냅니다.
//   } catch (error) {
//     res.status(400).send(error.message); // 에러 발생 시 400 코드와 함께 에러 내용을 보냅니다.
//   }
// };

// const { VectorValue } = require('@google-cloud/firestore'); // 필수 임포트

// ... 기존 설정들 (express, ai, firestore 등) ...

//대량 으로 데이터 집어넣기
// const bulkUploadChats = async (req, res) => {
//   try {
//     const { dataList } = req.body;

//     if (!dataList || !Array.isArray(dataList)) {
//       return res.status(400).send({ error: "dataList 배열이 필요합니다." });
//     }

//     console.log(`--- [일괄 등록 시작] 총 ${dataList.length}건 ---`);

//     for (const item of dataList) {
//       // 1. 고밀도 포맷 적용
//       const combinedText = `질문: ${item.q} 핵심어: ${item.q} 내용: ${item.a}`;

//       // 2. 임베딩 생성 (text-embedding-004)
//       const embeddingResponse = await ai.embed({
//         embedder: textEmbedding004,
//         content: combinedText,
//       });

//       // 3. 임베딩 값 추출 (rawValue 에러 해결 로직)
//       let temp = Array.isArray(embeddingResponse)
//         ? embeddingResponse[0]
//         : embeddingResponse;
//       let target = temp.embedding || temp;
//       let rawValue =
//         typeof target.values === "function"
//           ? target.values()
//           : target.values || target;
//       const vector = Array.isArray(rawValue) ? rawValue : Array.from(rawValue);

//       const firestoreVector = FieldValue.vector(vector);

//       // 5. Firestore 저장
//       await firestore.collection("chats").add({
//         question: item.q,
//         answer: item.a,
//         combined: combinedText,
//         embedding: firestoreVector, // vector<768> 타입으로 저장됨
//         timestamp: new Date(),
//       });

//       console.log(`✅ 성공: ${item.q.substring(0, 10)}...`);
//     }

//     res.status(200).send({
//       success: true,
//       message: "모든 데이터가 벡터 타입으로 저장되었습니다.",
//     });
//   } catch (error) {
//     console.error("Bulk Upload Error:", error);
//     res.status(500).send({ error: error.message });
//   }
// };



//이전 버전 데이터 증강 및 임베딩 버전
// const addChats = async (req, res) => {
//   try {
//     const { question, answer } = req.body;

//     if (!question || !answer) {
//       return res
//         .status(400)
//         .send({ error: "질문(question)과 답변(answer)이 모두 필요합니다." });
//     }

//     console.log("--- 데이터 증강 및 저장 시작 ---");

//     // [수정] 프롬프트 강화: 핵심 키워드를 보존하면서 다양한 어투로 생성 요청
//     const aiResponse = await ai.generate({
//       model: "googleai/gemma-3-27b-it",
//       prompt: `
//         다음은 난민 상담 질문입니다: "${question}"
//         이 질문의 핵심 의미와 키워드(예: 지원금, 학교, 비자 등)를 반드시 포함하여 
//         실제 사용자가 채팅창에 물어볼 법한 짧고 다양한 구어체 변형 질문 3개를 만들어줘. (예: 단답형, 의문형, 키워드 중심)
        
//         예시: "생계비 지원은 어떻게 하나요?" -> "돈이 없는데 지원금 신청 가능한가요?", "정부 생계비 지원 절차 알려줘"
//         출력 형식: 질문만 한 줄에 하나씩.`,
//     });

//     // 유사 질문들을 배열로 정리 (원본 포함 총 4개)
//     const variations = aiResponse.text
//       .split("\n")
//       .map((q) => q.replace(/^\d+\.\s*|^\-\s*/, "").trim()) // 번호나 기호 제거
//       .filter((q) => q.length > 0)
//       .slice(0, 3); // 안전하게 3개만

//     const allQuestions = [question, ...variations];
//     console.log(`생성된 유사 질문 포함 총 ${allQuestions.length}건 저장 시도`);

//     // // 2. 모든 질문 세트를 루프 돌며 저장
//     // for (const q of allQuestions) {
//     //   const newConv = new Chat(q, answer, new Date());

//     //   // 임베딩 생성
//     //   const embeddingResponse = await ai.embed({
//     //     embedder: textEmbedding004,
//     //     content: newConv.combined,
//     //   });

//     //   // [핵심] 이터레이터 및 배열 추출 (아까 성공했던 로직 적용)
//     //   let temp = Array.isArray(embeddingResponse) ? embeddingResponse[0] : embeddingResponse;
//     //   let target = temp.embedding || temp;
//     //   let rawValue = (typeof target.values === 'function') ? target.values() : (target.values || target);
//     //   const vectorArray = Array.from(rawValue);

//     //   // Firestore Vector 타입으로 변환
//     //   const vectorValue = Firestore.FieldValue.vector(vectorArray);

//     //   const dataToSave = {
//     //     ...newConv.toPlainObject(),
//     //     embedding: vectorValue,
//     //   };

//     //   await firestore.collection("chats").add(dataToSave);
//     // }

//     for (const q of allQuestions) {
//       const newConv = new Chat(q, answer, new Date());

//       // [수정 포인트] 검색(Search) 시 사용할 형식과 100% 일치시킵니다.
//       // 이렇게 저장해야 나중에 검색할 때 `질문: ${query}`와 거리가 가장 가깝게 계산됩니다.
//       const combinedForIndexing = `질문: ${q} 정답: ${answer}`;

//       // 임베딩 생성 (수정된 텍스트로 임베딩)
//       const embeddingResponse = await ai.embed({
//         embedder: textEmbedding004,
//         content: combinedForIndexing, // newConv.combined 대신 이것을 사용
//       });

//       // 2. [핵심] 임베딩 값 추출 (이 부분이 누락되어 에러가 났던 것입니다)
//       let temp = Array.isArray(embeddingResponse)
//         ? embeddingResponse[0]
//         : embeddingResponse;
//       let target = temp.embedding || temp;

//       // rawValue 정의
//       let rawValue =
//         typeof target.values === "function"
//           ? target.values()
//           : target.values || target;

//       const vectorArray = Array.from(rawValue);
//       const vectorValue = Firestore.FieldValue.vector(vectorArray);

//       const dataToSave = {
//         question: newConv.question,
//         answer: newConv.answer,
//         combined: newConv.combined,
//         timestamp: newConv.timestamp,
//         // embedding 필드를 넣지 않습니다.
//         // 현재 LLM 선별 방식에는 필요 없으며, 에러의 원인을 원천 차단합니다.
//       };

//       await firestore.collection("chats").add(dataToSave);
//     }

//     res.status(201).send({
//       success: true,
//       message: `원본과 유사 질문을 포함해 총 ${allQuestions.length}건의 데이터가 저장되었습니다.`,
//     });
//   } catch (error) {
//     console.error("AddChats Error:", error);
//     res.status(500).send({ error: error.message });
//   }
// };



////////////////////////////



 //관련 과거 대화 검색 및 데이터 추출 (최종 수정 버전)
//이전 버전 데이터 추출버전 데이터 100개이상때 유용할 것으로 판단.
// const getAiResponseWithHistory = async (req, res) => {
//   try {
//     const { question } = req.body;
//     if (!question) return res.status(400).send({ error: "질문 내용이 없습니다." });

//     console.log("--- [단계 1] 임베딩 생성 및 정밀 추출 ---");

//     const embeddingResponse = await ai.embed({
//       embedder: textEmbedding004,
//       content: String(question),
//     });

//     // --- [이터레이터 완벽 대응] 데이터 추출 로직 ---
//     let queryVector = null;
//     let temp = Array.isArray(embeddingResponse) ? embeddingResponse[0] : embeddingResponse;

//     // 1. embedding 필드 혹은 본체 확보
//     let target = temp.embedding || temp;

//     // 2. target이 values 메서드를 가지고 있다면 실행
//     let rawValue = (typeof target.values === 'function') ? target.values() : (target.values || target);

//     // 3. [핵심] rawValue가 이터레이터(Iterator)이거나 배열이 아닐 경우 배열로 강제 변환
//     queryVector = Array.isArray(rawValue) ? rawValue : Array.from(rawValue);

//     // --- 추출 로직 끝 ---

//     // 4. 차원 검증
//     if (!queryVector || queryVector.length !== 768) {
//       console.log("에러 직전 상세 타입:", typeof queryVector, "길이:", queryVector?.length);
//       throw new Error(`임베딩 생성 오류: 768차원 벡터 필요 (현재: ${queryVector?.length || 0}차원)`);
//     }

//     console.log("--- [단계 2] Firestore 벡터 검색 시작 ---");
//     const snapshot = await firestore.collection("chats").findNearest({
//       vectorField: "embedding",
//       queryVector: queryVector,
//       distanceMeasure: "COSINE",
//       limit: 5,
//       distanceResultField: "vector_score",
//     }).get();

//     // const SIMILARITY_THRESHOLD = 0.10;
//     // const contextData = snapshot.docs.map((doc) => {
//     //   const data = doc.data();
//     //   const score = doc.score ?? data.vector_score ?? 0;
//     //   return {
//     //     question: data.question,
//     //     answer: data.answer,
//     //     score: Number(score)
//     //   };
//     // }).filter((item) => {

//     //   // console.log(`[유사거리] ${item.score.toFixed(4)} (낮을수록 유사)`);

//     //   console.log(`[유사거리] ${item.score.toFixed(4)} (낮을수록 유사) | 질문: ${item.question.substring(0, 15)}...`);
//     //   return item.score <= SIMILARITY_THRESHOLD;
//     // });

//     // res.status(200).send({
//     //   success: true,
//     //   count: contextData.length,
//     //   extractedContext: contextData
//     // });

//     const SIMILARITY_THRESHOLD = 0.20; // 0.10은 너무 깐깐하니 0.20으로 살짝 완화

//     // 사용자 질문에서 키워드 추출 (공백 기준 분리, 2글자 이상 단어만)
//     const queryKeywords = question.split(' ').filter(word => word.length >= 2);

//     const contextData = snapshot.docs.map((doc) => {
//       const data = doc.data();
//       const score = doc.score ?? data.vector_score ?? 0;
//       return {
//         question: data.question,
//         answer: data.answer,
//         combined: data.combined || "", // DB에 저장된 combined 필드 활용
//         score: Number(score)
//       };
//     }).filter((item) => {
//       // 1. 벡터 점수 조건
//       const isClose = item.score <= SIMILARITY_THRESHOLD;

//       // 2. 키워드 매칭 조건 (사용자 질문의 단어가 DB 내용에 포함되어 있는지)
//       // 데이터가 적을 때 엉뚱한 답을 막아주는 핵심 가드레일입니다.
//       const hasKeyword = queryKeywords.some(keyword =>
//         item.combined.includes(keyword) || item.question.includes(keyword)
//       );

//       console.log(`[유사거리] ${item.score.toFixed(4)} | 키워드일치: ${hasKeyword} | 질문: ${item.question.substring(0, 15)}...`);

//       // 점수도 가깝고, 단어도 겹쳐야만 통과!
//       return isClose && hasKeyword;
//     });

//     res.status(200).send({
//       success: true,
//       count: contextData.length,
//       extractedContext: contextData
//     });

//   } catch (error) {
//     console.error("Critical Error:", error);
//     res.status(500).send({ error: error.message });
//   }
// };

//llm 간단한 버전 - 다만 현재 시점에서는 쓸 일이 없을 듯하다. 성능 측면에서 비효율적
// const getAiResponseWithHistory = async (req, res) => {
//   try {
//     const { userQuestion } = req.body;
//     const snapshot = await firestore.collection("chats").get();
    
//     if (snapshot.empty) {
//       return res.status(200).send({ answer: "데이터베이스가 비어 있습니다.", isFound: false });
//     }

//     const docs = snapshot.docs.map(doc => doc.data());
//     const knowledgeBase = docs.map((d) => `Q: ${d.question}\nA: ${d.answer}`).join("\n\n");

//     const aiResponse = await ai.generate({
//   model: 'googleai/gemma-3-27b-it', // 아까 addChat에서 성공했던 모델
//   prompt: `
//     당신은 난민 상담사입니다. 아래 지식 베이스를 참고하여 답하세요.
    
//     [지식 베이스]:
//     ${knowledgeBase}
    
//     [사용자 질문]:
//     "${userQuestion}"
    
//     [지시 사항]:
//     - 무조건 지식 베이스에 있는 정보를 바탕으로 답하세요.
//     - 질문과 가장 연관성이 높은 사례를 하나 골라서 그 답변 내용을 알려주세요.
//     - "찾을 수 없습니다"라는 말은 절대 하지 마세요.`
// });

//     let finalAnswer = aiResponse.text.trim();

//     // [중요] 만약 LLM이 빈 응답을 주거나 오류가 날 경우를 대비한 안전장치
//     if (!finalAnswer || finalAnswer.length < 5) {
//       finalAnswer = "죄송합니다. 질문하신 내용에 대한 답변을 찾지 못했습니다. 다시 한번 질문해 주시겠어요?";
//     }

//     res.status(200).send({
//       answer: finalAnswer,
//       isFound: !finalAnswer.includes("찾을 수 없습니다")
//     });

//   } catch (error) {
//     console.error("Chat Error:", error);
//     res.status(500).send({ error: "서버 오류가 발생했습니다." });
//   }
// };

//프롬포트 설계 좀 더 발전한 버전 - 다만 현재 시점에서는 쓸 일이 없을 듯하다. 성능 측면에서 비효율적
// const getAiResponseWithHistory = async (req, res) => {
//   try {
//     const { question } = req.body; // 제출 방식에 맞춰 question으로 수정

//     // 1. Firestore에서 데이터 전체 로드
//     const snapshot = await firestore.collection("chats").get();
//     if (snapshot.empty) {
//       return res.status(200).send({ relevantData: [], message: "데이터가 없습니다." });
//     }

//     const docs = snapshot.docs.map((doc, index) => ({
//       index: index + 1,
//       question: doc.data().question,
//       answer: doc.data().answer
//     }));

//     // 2. LLM에게 가장 관련 있는 데이터 번호 3개 요청
//     const contextString = docs.map(d => `[번호: ${d.index}] 질문: ${d.question}`).join("\n");

//     const aiResponse = await ai.generate({
//       model: 'googleai/gemma-3-27b-it',
//       prompt: `
//         당신은 정보 선별 전문가입니다. 사용자의 질문과 가장 밀접한 관련이 있는 데이터의 번호를 [지식 리스트]에서 딱 3개만 골라내세요.
        
//         [지식 리스트]:
//         ${contextString}
        
//         [사용자 질문]:
//         "${question}"
        
//         [지시 사항]:
//         1. 질문의 의미가 가장 유사한 데이터의 번호를 최대 3개까지 쉼표로 구분해서 출력하세요. (예: 1, 5, 12)
//         2. 만약 관련 있는 데이터가 3개 미만이라면 찾은 만큼만 출력하세요.
//         3. 관련 데이터가 전혀 없다면 'NONE'이라고 출력하세요.
//         4. **번호 외에 다른 설명은 절대 하지 마세요.**`
//     });

//     const rawOutput = aiResponse.text.trim();
//     console.log("선별된 번호:", rawOutput);

//     // 3. 결과 처리 및 데이터 매칭
//     if (rawOutput.includes('NONE') || !rawOutput) {
//       return res.status(200).send({ relevantData: [], count: 0 });
//     }

//     // 숫자만 추출하여 해당 데이터 필터링
//     const selectedIndices = rawOutput.match(/\d+/g)?.map(n => parseInt(n)) || [];
//     const relevantData = docs
//       .filter(d => selectedIndices.includes(d.index))
//       .slice(0, 3); // 안전하게 최대 3개 보장

//     // 4. 원본 데이터 세트 반환
//     res.status(200).send({
//       relevantData: relevantData.map(d => ({ 
//         question: d.question, 
//         answer: d.answer 
//       })),
//       count: relevantData.length
//     });

//   } catch (error) {
//     console.error("Selection Error:", error);
//     res.status(500).send({ error: "데이터 추출 중 오류 발생" });
//   }
// };

/////////////////////////////

//행정서류에서 추출한 텍스트 혹은 답변 내역을 저장합니다.
const addLogs = async (req, res, next) => {
  try {
    const { role, content } = req.body;

    const validatedLog = new Log(role, content, new Date());

   
    // 2. 가공된 객체 형태로 저장 (클래스 인스턴스를 일반 객체로 변환)
    const dataToSave = {
      role: validatedLog.role,
      content: validatedLog.content,
      timestamp: validatedLog.timestamp,
      // embedding: embedding, // 검색 성능을 위해 나중에 꼭 추가하세요!
    };

    // Firestore와 같은 NoSQL 데이터베이스에서는 숫자를 1씩 늘리는 방식(Auto-increment)을 권장하지 않습니다. 그 이유는 여러 사용자가 동시에 질문을 할 경우 '현재 번호'가 몇 번인지 확인하고 충돌을 피하는 로직이 매우 복잡하고 성능을 떨어뜨리기 때문입니다.
    //문서 ID를 지정하지 않기 (가장 권장)
    // 앞서 말씀드린 .add()를 사용하면 Firestore가 7h9aX1... 같은 고유 ID를 자동으로 만듭니다.
    // 왜 이렇게 하나요? ID가 docId1이 아니더라도, 저장된 timestamp를 기준으로 정렬하면 순서를 완벽하게 가져올 수 있기 때문입니다. 굳이 번호를 붙일 필요가 없습니다.
    await firestore.collection("logs").add(dataToSave);

    res.send("Record saved successfully"); // 성공 메시지를 클라이언트에 보냅니다.
  } catch (error) {
    res.status(400).send(error.message); // 에러 발생 시 400 코드와 함께 에러 내용을 보냅니다.
  }
};

//최신순으로 조회하는 방식 구현은 간단함. 우선 보류

// // 1. 최신순(desc)으로 6개를 가져옵니다. (최근 대화 3쌍)
// const snapshot = await firestore.collection("logs")
//   .orderBy("timestamp", "desc")
//   .limit(6)
//   .get();

// // 2. 결과는 최신순으로 되어 있으므로, AI에게 줄 때는 다시 시간순(과거->현재)으로 뒤집어줍니다.
// const history = snapshot.docs
//   .map(doc => doc.data())
//   .reverse(); // 중요: AI는 과거부터 현재 순서로 읽어야 맥락을 이해합니다.

/**
 * 1. 텍스트 챗봇 전송 (기존 방식 유지)
 */

const getAllChats = async (req, res, next) => {
  try {
    const snapshot = await firestore
      .collection("chats")
      .orderBy("timestamp", "asc")
      .get();
    // const data = snapshot;
    // const chatsArray = [];
    // if (data.empty) {
    //   res.status(404).send("No User Record found");
    // }

    if (snapshot.empty) {
      return res.status(404).send("No Record found");
    }

    // 1. 데이터가 6개 이하일 때: 기존 로직 실행
    if (snapshot.size <= 6) {
      const chatsArray = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // --- 날짜 변환 로직 추가 ---
        let formattedTimestamp = data.timestamp;

        // 만약 timestamp가 Firestore의 Timestamp 객체라면 (.toDate() 함수가 있다면)
        if (data.timestamp && typeof data.timestamp.toDate === "function") {
          formattedTimestamp = data.timestamp.toDate().toISOString(); // ISO 8601 형식 문자열로 변환
        }

        const chat_data = {
          role: data.role,
          content: data.content,
          timestamp: formattedTimestamp, // 가공된 날짜를 넣어줌
        };
        chatsArray.push(chat_data);
      });
      return res.send(chatsArray);
    }

    // // 2. 데이터가 6개 초과일 때: Genkit 로직 실행
    // else {
    //   // getAiResponseWithHistory는 Genkit을 사용해 정의한 함수입니다.
    //   // req.body.question 등 실제 질문 텍스트를 인자로 넘겨줍니다.
    //   const aiResponse = await getAiResponseWithHistory(req.body.question);
    //   return res.send({ answer: aiResponse });
    // }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

//genkit에 보내는 양식같은거?
// /**
//  * snapshot을 Genkit 프롬프트나 Retriever에서 쓸 수 있는
//  * '과거 내역 텍스트'로 변환하는 함수
//  */
// const extractLogsForAi = (snapshot) => {
//   // 1. snapshot.docs를 사용해 배열로 변환하고,
//   // 2. 각 문서의 data()를 호출해 필요한 필드만 추출합니다.
//   const logHistory = snapshot.docs.map(doc => {
//     const data = doc.data();
//     return `${data.role === 'user' ? '질문' : '답변'}: ${data.content}`;
//   });

//   // 3. AI가 읽기 좋게 하나의 문자열로 합쳐줍니다.
//   return logHistory.join('\n');
// };

// const getAllChats = async (req, res, next) => {
//   try {
//     const snapshot = await firestore.collection("logs").orderBy("timestamp", "asc").get();

//     if (snapshot.size > 6) {
//       // 1. snapshot에서 AI에게 줄 과거 맥락 추출
//       const contextText = extractLogsForAi(snapshot);

//       // 2. Genkit 실행 (추출한 contextText를 프롬프트에 주입)
//       const aiResponse = await generate({
//         model: 'gemini-1.5-flash',
//         prompt: `
//           당신은 난민 행정 전문가입니다.
//           아래의 [과거 상담 기록]을 참고하여 사용자의 새로운 질문에 답변하세요.

//           [과거 상담 기록]
//           ${contextText}

//           [사용자의 현재 질문]
//           ${req.body.question}
//         `,
//       });

//       return res.send({ answer: aiResponse.text() });
//     }

//     // (6개 이하면 기존처럼 User 객체 배열 반환...)
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// };

const getAllLogs = async (req, res, next) => {
  try {
    const snapshot = await firestore
      .collection("logs")
      .orderBy("timestamp", "asc")
      .get();
    // const data = snapshot;
    // const chatsArray = [];
    // if (data.empty) {
    //   res.status(404).send("No User Record found");
    // }

    if (snapshot.empty) {
      return res.status(404).send("No Record found");
    }

    // 1. 데이터가 6개 이하일 때: 기존 로직 실행
    if (snapshot.size <= 6) {
      const logsArray = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // --- 날짜 변환 로직 추가 ---
        let formattedTimestamp = data.timestamp;

        // 만약 timestamp가 Firestore의 Timestamp 객체라면 (.toDate() 함수가 있다면)
        if (data.timestamp && typeof data.timestamp.toDate === "function") {
          formattedTimestamp = data.timestamp.toDate().toISOString(); // ISO 8601 형식 문자열로 변환
        }

        const log_data = {
          role: data.role,
          content: data.content,
          timestamp: formattedTimestamp, // 가공된 날짜를 넣어줌
        };
        logsArray.push(log_data);
      });
      return res.send(logsArray);
    }

    // // 2. 데이터가 6개 초과일 때: Genkit 로직 실행
    // else {
    //   // getAiResponseWithHistory는 Genkit을 사용해 정의한 함수입니다.
    //   // req.body.question 등 실제 질문 텍스트를 인자로 넘겨줍니다.
    //   const aiResponse = await getAiResponseWithHistory(req.body.question);
    //   return res.send({ answer: aiResponse });
    // }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateChats = async (req, res, next) => {
  try {
    const newChatData = req.body;
    //URL 주소에 포함된 문서의 고유 ID를 가져옵니다. 설명: 보통 API 주소가 /update/abc1234 형태라면, 끝에 붙은 abc1234가 id가 됩니다.
    const ChatID = req.params.id;
    const ChatSnapshot = await firestore.collection("chats").doc(ChatID);
    const ChatData = await ChatSnapshot.get();

    if (!ChatData.exists) {
      res.status(404).send("Chats with given ID not found");
    } else {
      ChatSnapshot.update(newChatData);
      res.send(`Update Successfully\n
      Updated Chat ID : ${ChatID}\n
      new Chat Data : {
        role : ${req.body.role},
        content : ${req.body.content}
      }
      `);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateLogs = async (req, res, next) => {
  try {
    const newLogData = req.body;
    //URL 주소에 포함된 문서의 고유 ID를 가져옵니다. 설명: 보통 API 주소가 /update/abc1234 형태라면, 끝에 붙은 abc1234가 id가 됩니다.
    const LogID = req.params.id;
    const LogSnapshot = await firestore.collection("logs").doc(LogID);
    const LogData = await LogSnapshot.get();

    if (!LogData.exists) {
      res.status(404).send("Logs with given ID not found");
    } else {
      LogSnapshot.update(newLogData);
      res.send(`Update Successfully\n
      Updated Log ID : ${LogID}\n
      new Log Data : {
        role : ${req.body.role},
        content : ${req.body.content}
      }
      `);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const deleteChats = async (req, res, next) => {
  try {
    const ChatID = req.params.id;
    const ChatSnapshot = await firestore.collection("chats").doc(ChatID);
    const chatData = await ChatSnapshot.get();

    if (!chatData.exists) {
      res.status(404).send("Chat with given ID not found");
    } else {
      res.send(`Delete Successfully!
      Deleted Chat ID : ${ChatID}
      Deleted Chat Data : {
        role : ${chatData.data().role},
        content : ${chatData.data().content}
      }
      `);
      ChatSnapshot.delete();
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const deleteLogs = async (req, res, next) => {
  try {
    const LogID = req.params.id;
    const LogSnapshot = await firestore.collection("logs").doc(LogID);
    const logData = await LogSnapshot.get();

    if (!logData.exists) {
      res.status(404).send("Log with given ID not found");
    } else {
      res.send(`Delete Successfully!
      Deleted Log ID : ${LogID}
      Deleted Log Data : {
        role : ${logData.data().role},
        content : ${logData.data().content}
      }
      `);
      LogSnapshot.delete();
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = {
  addChats,
  addLogs,
  getAllChats,
  getAllLogs,
  updateChats,
  updateLogs,
  deleteChats,
  deleteLogs,
  getAiResponseWithHistory,
  bulkUploadChats,
};

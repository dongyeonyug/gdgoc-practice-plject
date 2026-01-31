
"use strict";

// 1. 환경변수 로드 (최상단)
require("dotenv").config();

const firestore = require("../db");

const Chat = require("../models/chats");
const Log = require("../models/logs");

const { ai } = require("../config/genkit");

const addChat = async (req, res) => {
  try {
    const { question, answer } = req.body;

    // 1. 모델 인스턴스 생성
    const newChat = new Chat(question, answer);

    // 2. 모델 내부 로직을 통해 데이터 유효성 검사
    if (!newChat.isValid()) {
      return res
        .status(400)
        .send({ error: "질문과 답변을 모두 올바르게 입력해주세요." });
    }

    // 3. Firestore에 클래스에서 정제된 데이터 저장
    await firestore.collection("chats").add(newChat.toFirestore());

    res.status(201).send({
      success: true,
      message: "데이터 저장 성공",
      data: { question: newChat.question, answer: newChat.answer },
    });
  } catch (error) {
    console.error("AddChat Error:", error);
    res.status(500).send({ error: "저장 중 오류가 발생했습니다." });
  }
};

const getAllChats = async (req, res) => {
  try {
    // 최신순(createdAt 내림차순)으로 정렬하여 최대 50개만 호출
    const snapshot = await firestore
      .collection("chats")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return res
        .status(200)
        .send({ data: [], message: "저장된 데이터가 없습니다." });
    }

    // 데이터 매핑
    //원래 있던 데이터를 → 내가 쓰기 좋은 모양으로 바꾸는 작업
    const allData = snapshot.docs.map((doc) => ({
      id: doc.id, // Firestore 문서의 고유 ID 추가 (삭제 시 필수!)
      question: doc.data().question,
      answer: doc.data().answer,
    }));

    // 2. Vertex AI에게 전달할 최적화된 프롬프트 텍스트 생성
    // AI가 "아, 이게 지식 베이스구나"라고 바로 인식할 수 있는 포맷입니다.
    const promptContext = allData
      .map((d, i) => `[사례 ${i + 1}]\n질문: ${d.question}\n답변: ${d.answer}`)
      .join("\n\n");

    // 전체 데이터를 그대로 전달 (이 데이터를 Vertex AI 모델에게 통째로 넘기시면 됩니다)
    res.status(200).send({
      data: allData,
      promptContext: promptContext, // Vertex AI 전송용 (핵심!)
    });
  } catch (error) {
    console.error("GetAllChats Error:", error);
    res.status(500).send({ error: "데이터 호출 중 오류가 발생했습니다." });
  }
};


const deleteChat = async (req, res) => {
  try {
    // 1. URL 파라미터에서 삭제할 문서 ID 추출 (예: /api/chats/:id)
    const { id } = req.params;

    if (!id) {
      return res.status(400).send({ error: "삭제할 문서의 ID가 필요합니다." });
    }

    // 2. Firestore에서 해당 ID의 문서 참조 후 삭제
    const docRef = firestore.collection("chats").doc(id);
    const doc = await docRef.get();

    // 해당 문서가 실제로 존재하는지 확인
    if (!doc.exists) {
      return res.status(404).send({ error: "삭제하려는 데이터가 존재하지 않습니다." });
    }

    await docRef.delete();

    res.status(200).send({
      success: true,
      message: "데이터가 성공적으로 삭제되었습니다.",
      deletedId: id
    });
  } catch (error) {
    console.error("DeleteChat Error:", error);
    res.status(500).send({ error: "삭제 중 오류가 발생했습니다." });
  }
};




const addLog = async (req, res) => {
  try {
    // 서류 원본과 AI 답변을 한꺼번에 받음
    const { rawText, aiResponse } = req.body;

    if (!rawText || !aiResponse) {
      return res.status(400).send({ error: "데이터와 답변 모두 필요합니다." });
    }

    // [핵심] AI에게 서류 내용 요약 시키기
    const summaryResponse = await ai.generate({
      model: "googleai/gemma-3-27b-it",
      prompt: `다음 행정 서류의 내용을 나중에 참고하기 좋게 1문장으로 핵심만 요약해줘.\n\n서류 내용: ${rawText.substring(
        0,
        1000
      )}`,
    });

    const summary = summaryResponse.text;

    // 1. 모델 인스턴스 생성
    // 1. 모델 인스턴스 생성 (요약문 포함)
    const newLog = new Log(rawText, aiResponse, summary);

    // 2. 모델 내부 로직을 통해 데이터 유효성 검사
    if (!newLog.isValid()) {
      return res
        .status(400)
        .send({ error: "데이터와 답변 모두 올바르게 입력되지 않았습니다." });
    }

    // 3. Firestore에 클래스에서 정제된 데이터 저장
    await firestore.collection("logs").add(newLog.toFirestore());

    res.status(201).send({
      success: true,
      message: "데이터 저장 성공",
      data: {
        rawText: newLog.rawText,
        aiResponse: newLog.aiResponse,
        summary: newLog.summary,
      },
    });
  } catch (error) {
    console.error("AddLogs Error:", error);
    res.status(500).send({ error: "저장 중 오류가 발생했습니다." });
  }
};

const getAllLogs = async (req, res) => {
  try {
    // 최신순(createdAt 내림차순)으로 정렬하여 최대 50개만 호출
    const snapshot = await firestore
      .collection("logs")
      .orderBy("savedAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return res
        .status(200)
        .send({ data: [], message: "저장된 데이터가 없습니다." });
    }

    // 데이터 매핑
    //원래 있던 데이터를 → 내가 쓰기 좋은 모양으로 바꾸는 작업
    const allData = snapshot.docs.map((doc) => ({
      rawText: doc.data().rawText,
      aiResponse: doc.data().aiResponse,
      summary: doc.data().summary, // 저장할 때 만든 요약본 활용
    }));

    // 2. AI 전달용 프롬프트 가공 (요약본 활용)
    const promptContext = allData
      .map((log, index) => {
        // 요약본이 있으면 요약본을, 없으면 앞부분만 잘라서 사용
        const briefContext =
          log.summary || log.rawText.substring(0, 150) + "...";

        return `### [과거 사례 ${index + 1}]
- 서류 요약: ${briefContext}
- 가이드 내용: ${log.aiResponse}
---------------------------------------`;
      })
      .join("\n\n");

    // 전체 데이터를 그대로 전달 (이 데이터를 Vertex AI 모델에게 통째로 넘기시면 됩니다)
    res.status(200).send({
      data: allData,
      promptContext: promptContext, // Vertex AI에게 보낼 정제된 지식 베이스
    });
  } catch (error) {
    console.error("GetAllLogs Error:", error);
    res.status(500).send({ error: "데이터 호출 중 오류가 발생했습니다." });
  }
};

module.exports = {
  addChat,
  getAllChats,
  addLog,
  getAllLogs,
  deleteChat
};

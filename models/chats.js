class Chat {
  constructor(question, answer) {
    //question?.trim()에서 ?는 뭐야?->question이 undefined / null이면 error안뜨고 결과는 undefined
    //“공백만 있는 입력”을 무효 처리하기 위해서 trim()을 쓴다
    this.question = question?.trim();
    this.answer = answer?.trim();
    this.createdAt = new Date();
  }

  // 데이터가 유효한지 확인하는 메서드
  isValid() {
    return this.question && this.answer && this.question.length > 0 && this.answer.length > 0;
  }

  

  //이 Chat 객체를 Firestore에 저장 가능한 순수 데이터로 바꿔주는 함수
  //  newChat은 클래스 인스턴스
  // 안에:
  // 메서드 (isValid, toFirestore)
  // 내부 로직

  // Firestore는 순수 JSON 데이터만 저장 가능
  toFirestore() {
    return {
      question: this.question,
      answer: this.answer,
      createdAt: this.createdAt
    };
  }
}

module.exports = Chat;
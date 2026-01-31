const admin = require('firebase-admin');
require('dotenv').config(); 

if (!admin.apps.length) {
  // 1. 클라우드 환경인지 확인 (GOOGLE_APPLICATION_CREDENTIALS 변수가 파일 경로인지, 아니면 비어있는지 체크)
  const isCloud = !process.env.GOOGLE_APPLICATION_CREDENTIALS;

  admin.initializeApp({
    // 클라우드면 자동 인증(applicationDefault), 로컬이면 기존처럼 파일로 인증
    credential: isCloud 
      ? admin.credential.applicationDefault() 
      : admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  });
}

const db = admin.firestore();
module.exports = db;
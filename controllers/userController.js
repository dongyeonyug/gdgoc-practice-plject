//Express 컨트롤러에서 클라이언트의 요청을 받아 Firebase Firestore에 데이터를 저장하는 전형적인 로직


//"use strict";: 자바스크립트의 '엄격 모드'를 활성화합니다. 사소한 코딩 실수를 에러로 잡아내 주어 더 안전한 코드를 짜게 해줍니다.
"use strict";
 
const firestore = require("../db");
const User = require("../models/user");
// const firestore = firebase.firestore;
 
const addUser = async (req, res, next) => {
  try {
    //이 코드는 **"클라이언트가 보낸 데이터를 변수에 담는 과정"**입니다.
    // req (Request): 클라이언트(Postman, 웹 브라우저 등)가 서버로 보낸 모든 정보가 담긴 객체입니다.
    // .body: 그중에서도 사용자가 입력하여 전송한 실제 데이터 내용이 들어있는 곳입니다.
    // const data = req.body; // 클라이언트(Postman 등)가 보낸 JSON 데이터를 통째로 가져옵니다.
    
    const { name, age } = req.body;

    // 1. 데이터 스키마 검증
    // req.body를 그대로 넣지 않고, User 클래스를 통해 한 번 거릅니다.
    // 여기서 조건에 맞지 않으면 위 User 클래스에서 throw한 에러가 catch로 갑니다.
    const validatedUser = new User(name, age);

    // 2. 가공된 객체 형태로 저장 (클래스 인스턴스를 일반 객체로 변환)
    const dataToSave = {
      name: validatedUser.name,
      age: validatedUser.age
    };


    // Firestore의 "CRUD_TEST"라는 컬렉션에 데이터를 저장합니다.
    //firestore: Firestore 데이터베이스에 접근하기 위한 연결 통로입니다.
    //.collection("CRUD_TEST"): 데이터베이스 내의 **'CRUD_TEST'라는 이름의 폴더(컬렉션)**를 선택합니다. 만약 이 이름의 컬렉션이 없다면 Firestore가 자동으로 새로 만듭니다.
    //.doc(): 해당 컬렉션 안에 새로운 문서(Document)를 하나 생성합니다. 괄호 안에 아무것도 적지 않으면 Firestore가 중복되지 않는 고유한 ID(예: 7h9aX1...)를 자동으로 생성하여 부여합니다.
    //.set(data): 위에서 생성한 문서 안에 클라이언트로부터 받은 data를 **실제로 기록(저장)**합니다.
    //await: 데이터를 저장하는 작업은 네트워크를 통해 이루어지므로 시간이 걸립니다. 이 작업이 완료될 때까지 다음 코드로 넘어가지 않고 기다려라는 뜻입니다.
    await firestore.collection("CRUD_TEST").doc().set(dataToSave);
    
    res.send("Record saved successfully"); // 성공 메시지를 클라이언트에 보냅니다.
  } catch (error) {
    res.status(400).send(error.message); // 에러 발생 시 400 코드와 함께 에러 내용을 보냅니다.
  }
};
 

const getAllUser = async (req, res, next) => {
  try {
    const snapshot = await firestore.collection("CRUD_TEST").get();
    const data = snapshot;
    const usersArray = [];
    if (data.empty) {
      res.status(404).send("No User Record found");
    } else {
      //snapshot**은 Firestore의 CRUD_TEST 컬렉션에서 가져온 문서들의 집합체입니다.
      //.forEach**는 이 뭉치 안에 있는 문서들을 하나씩 꺼내서 반복 작업을 하겠다는 뜻입니다.
      snapshot.forEach((doc) => {
        //doc.data(): 문서 안에 저장된 실제 필드 값들(이름, 나이 등)을 가져오는 함수입니다.
        //doc.data().name / doc.data().age: 저장된 데이터 중 '이름'과 '나이' 값만 쏙쏙 골라냅니다.
        //User 클래스를 사용하여 데이터를 규격에 맞는 **인스턴스(객체)**로 만듭니다.
        const user_data = new User(doc.data().name, doc.data().age);
        usersArray.push(user_data);
      });
    }
    res.send(usersArray);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const newUserData = req.body;
    //URL 주소에 포함된 문서의 고유 ID를 가져옵니다. 설명: 보통 API 주소가 /update/abc1234 형태라면, 끝에 붙은 abc1234가 id가 됩니다.
    const userID = req.params.id;
    const userSnapshot = await firestore.collection("CRUD_TEST").doc(userID);
    const userData = await userSnapshot.get();
 
    if (!userData.exists) {
      res.status(404).send("User with given ID not found");
    } else {
      userSnapshot.update(newUserData);
      res.send(`Update Successfully\n
      Updated User ID : ${userID}\n
      new User Data : {
        name : ${req.body.name},
        age : ${req.body.age}
      }
      `);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};


const deleteUser = async (req, res, next) => {
  try {
    const userID = req.params.id;
    const userSnapshot = await firestore.collection("CRUD_TEST").doc(userID);
    const userData = await userSnapshot.get();
 
    if (!userData.exists) {
      res.status(404).send("User with given ID not found");
    } else {
      res.send(`Delete Successfully!
      Deleted User ID : ${userID}
      Deleted User Data : {
        name : ${userData.data().name},
        age : ${userData.data().age}
      }
      `);
      userSnapshot.delete();
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};


module.exports = {
  addUser,
  getAllUser,
  updateUser,
  deleteUser
};
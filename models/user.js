// models/user.js
class User {
  constructor(name, age) {
    // 유효성 검사: 이름이 문자열이 아니거나, 나이가 숫자가 아닐 경우 에러 발생
    if (!name || typeof name !== 'string') {
      throw new Error("Invalid data: 'name' is required and must be a string.");
    }
    if (age === undefined || typeof age !== 'number') {
      throw new Error("Invalid data: 'age' is required and must be a number.");
    }

    this.name = name;
    this.age = age;
  }
}

module.exports = User;
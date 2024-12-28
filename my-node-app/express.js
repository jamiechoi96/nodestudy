const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/hi', (req, res) => {
  res.send('Hello');
});

app.listen(3000, () => {
  console.log('Express 서버가 http://localhost:3000 에서 실행 중입니다');
});


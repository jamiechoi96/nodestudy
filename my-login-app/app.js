const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// ✅ EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// ✅ body-parser 설정
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ 로그인 페이지 라우터
app.get('/login', (req, res) => {
  res.render('login'); // login.ejs 템플릿 렌더링
});

// ✅ 로그인 POST 요청 처리
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 간단한 아이디, 비밀번호 체크
  if (username === 'admin' && password === '1234') {
    res.redirect('/'); // 로그인 성공 시 홈 페이지로 리디렉션
  } else {
    res.send('아이디 또는 비밀번호가 잘못되었습니다');
  }
});

// ✅ 홈 페이지 라우터
app.get('/', (req, res) => {
  const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`접속한 사용자 IP: ${userIP}`);
  res.send('Hello, your IP has been logged.');
});

// ✅ Query String 예제 1
app.get('/example', (req, res) => {
  const name = req.query.name || 'Guest'; // name이 없으면 'Guest'
  res.send(`Hello, ${name}`);
});

// ✅ Query String 예제 2
app.get('/example2', (req, res) => {
  const name = req.query.name || 'Unknown';
  const age = req.query.age || 'Unknown';
  const city = req.query.city || 'Unknown';
  
  res.send(`Name: ${name}, Age: ${age}, City: ${city}`);
});

// ✅ IP 주소 확인 페이지
app.get('/ip', (req, res) => {
  const userIP = req.ip;
  res.send(`Your IP address is: ${userIP}`);
});

// ✅ 서버 실행
app.listen(3000, () => {
  console.log('서버가 http://localhost:3000 에서 실행 중');
});

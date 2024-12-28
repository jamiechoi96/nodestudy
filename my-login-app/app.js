const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2'); // MySQL 모듈 추가
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

// MySQL 연결 설정
const db = mysql.createConnection({
  host: '192.168.0.105',
  user: 'root',
  password: '1234', // 비밀번호 설정
  database: 'lg_hellovisionvod'   // 사용할 데이터베이스 설정
});

// MySQL 연결
db.connect(err => {
  if (err) {
      console.error('MySQL 연결 실패:', err);
      return;
  }
  console.log('MySQL 연결 성공');
});

// `/data` 경로에서 MySQL 데이터 조회 및 렌더링
app.get('/data', (req, res) => {
  const query = `
      SELECT
          asset_nm,
          smry,
          CONCAT(
              LPAD(LEFT(disp_rtm, LENGTH(disp_rtm) - 2), 2, '0'), ':',
              LPAD(RIGHT(disp_rtm, 2), 2, '0')
          ) AS disp_rtm_formatted
      FROM vod_mart
      WHERE asset_nm LIKE '%런닝맨%';
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('쿼리 오류:', err);
          return res.send('데이터를 불러오는 중 오류가 발생했습니다.');
      }
      res.render('data', { data: results });
  });
});

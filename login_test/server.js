// 필요한 모듈 불러오기
const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();
dotenv.config(); // .env 파일 로드

// MySQL 연결 설정
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "sys",
});

// 데이터베이스 연결 확인
db.connect((err) => {
  if (err) {
    console.error("DB 연결 실패:", err);
  } else {
    console.log("DB 연결 성공");
  }
});

// Multer 설정 (이미지 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/image/"); // 이미지 저장 경로
  },
  filename: (req, file, cb) => {
    const randomName = Math.random().toString(36).substring(2, 10); // 랜덤 파일명 생성
    const ext = path.extname(file.originalname); // 파일 확장자 추출
    cb(null, randomName + ext); // 랜덤 이름 + 확장자
  },
});

const upload = multer({ storage: storage });

// 미들웨어 설정
app.set("view engine", "ejs"); // EJS 템플릿 엔진 사용
app.use(express.static("public")); // 정적 파일 제공
app.use(express.json()); // JSON 형식 데이터 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱
app.use(express.static(path.join(__dirname, "public"))); // 정적 파일 경로

// 세션 설정
app.use(
  session({
    secret: "secret_key", // 세션 암호화 키
    resave: false, // 세션을 변경하지 않아도 저장 여부
    saveUninitialized: true, // 초기화되지 않은 세션 저장 여부
    cookie: { secure: false }, // HTTPS 사용 시 true로 설정
  })
);

// 라우트 설정

// 메인 페이지
app.get("/", (req, res) => {
  res.render("index");
});

// 회원가입 페이지 (GET)
app.get("/register", (req, res) => {
  res.render("register");
});

// 회원가입 처리 (POST)
app.post("/register", upload.single("image"), (req, res) => {
  const { name, username, password } = req.body;
  const image = req.file ? path.basename(req.file.path) : null; // 파일명 추출

  // 사용자 정보 DB 삽입
  const query =
    "INSERT INTO user (id, name, password, img) VALUES (?, ?, ?, ?)";

  db.query(query, [username, name, password, image], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).send("이미 존재하는 아이디입니다.");
      }
      console.error("데이터베이스 오류", err);
      return res.status(500).send("회원가입 실패");
    }
    res.redirect("/login"); // 성공 시 로그인 페이지로 이동
  });
});

// 로그인 페이지 (GET)
app.get("/login", (req, res) => {
  res.render("login");
});

// 로그인 처리 (POST)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // 사용자 정보 조회
  const query = "SELECT * FROM user WHERE id = ?";
  db.query(query, [username], (err, result) => {
    if (err) {
      console.error("데이터베이스 오류", err);
      return res.status(500).send("서버 오류");
    }

    if (result.length === 0) {
      return res.status(401).send("아이디가 존재하지 않습니다.");
    }

    // 비밀번호 확인 (단순 비교)
    if (password !== result[0].password) {
      return res.status(401).send("비밀번호가 일치하지 않습니다.");
    }

    // 세션에 사용자 정보 저장
    req.session.user = {
      name: result[0].name,
      img: result[0].img,
    };

    res.redirect("/welcome"); // 성공 시 welcome 페이지로 이동
  });
});

// 로그인 후 환영 페이지
app.get("/welcome", (req, res) => {
  const user = req.session ? req.session.user : null; // 세션에서 사용자 정보 확인

  if (!user) {
    return res.redirect("/login"); // 로그인되지 않은 경우 로그인 페이지로 이동
  }

  res.render("welcome", {
    name: user.name,
    image: user.img,
  });
});

// 로그아웃
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("로그아웃 실패");
    }
    res.redirect("/login"); // 로그아웃 후 로그인 페이지로 이동
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000; // .env 포트 설정, 기본 3000
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});

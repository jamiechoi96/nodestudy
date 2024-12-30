const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const session = require("express-session"); // 세션 모듈 추가
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

// Multer 설정 (이미지 파일 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/image/"); // 이미지 파일을 저장할 폴더를 public/image/로 수정
  },
  filename: (req, file, cb) => {
    const randomName = Math.random().toString(36).substring(2, 10); // 랜덤 문자열 생성
    const ext = path.extname(file.originalname); // 파일 확장자
    cb(null, randomName + ext); // 랜덤 문자열 + 확장자
  },
});

const upload = multer({ storage: storage });

// EJS 템플릿 엔진 설정
app.set("view engine", "ejs");
app.use(express.static("public")); // 정적 파일 제공

// JSON과 URL-encoded 데이터를 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// 세션 설정
app.use(
  session({
    secret: "secret_key", // 세션 암호화에 사용할 비밀 키
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 개발 환경에서는 false, 실제 서비스에서는 true
  })
);

// 기본 페이지 라우트 (index.ejs)
app.get("/", (req, res) => {
    res.render("index"); // 메인 페이지 렌더링
  });
  
// 회원가입 라우트
app.get("/register", (req, res) => {
  res.render("register"); // 회원가입 페이지 렌더링
});

app.post("/register", upload.single("image"), (req, res) => {
  const { name, username, password } = req.body;
  const image = req.file ? path.basename(req.file.path) : null; // 경로에서 파일명만 추출

  // MySQL에 데이터 삽입
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
    res.redirect("/login"); // 로그인 페이지로 리디렉션
  });
});

// 로그인 라우트
app.get("/login", (req, res) => {
  res.render("login"); // 로그인 페이지 렌더링
});

app.post("/login", (req, res) => {
  const { username, password } = req.body; // 'id' -> 'username'

  // MySQL에서 사용자 정보 조회
  const query = "SELECT * FROM user WHERE id = ?";
  db.query(query, [username], (err, result) => {
    if (err) {
      console.log("데이터베이스 오류", err);
      return res.status(500).send("서버 오류");
    }

    if (result.length === 0) {
      return res.status(401).send("아이디가 존재하지 않습니다");
    }

    // 비밀번호 비교 (암호화 안 사용 시에는 그냥 평문으로 비교)
    if (password !== result[0].password) {
      return res.status(401).send("비밀번호가 일치하지 않습니다");
    }

    // 로그인 성공 시 세션에 사용자 정보 저장
    req.session.user = {
      name: result[0].name,
      img: result[0].img,
    };

    // 로그인 성공 후 welcome.ejs로 리디렉션
    res.redirect("/welcome");
  });
});

// 로그인 성공 후 리디렉션된 경로에서 사용자 정보를 렌더링하는 라우터 추가
app.get("/welcome", (req, res) => {
  const user = req.session ? req.session.user : null; // 세션에서 사용자 정보 가져오기

  if (!user) {
    return res.redirect("/login"); // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  }

  res.render("welcome", {
    name: user.name,
    image: user.img, // 로그인한 사용자의 이미지
  });
});

// 로그아웃 라우터
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("로그아웃 실패");
    }
    res.redirect("/login"); // 로그아웃 후 로그인 페이지로 리디렉션
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000; // .env에 포트가 없으면 기본 3000번 포트 사용
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});

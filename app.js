const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('dotenv').config(); 
//config호출-> 서버시작시, .env의 비밀키들을 process.env에 넣으므로 process.env.COOKIE_SECRET처럼 키를 사용할수 있음 .env유출안되게 관리, json파일은 process.env사용 못함 (시퀄라이즈 설정을 담아둔 config.json)

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
//데이터베이스 생성 후 모델을 서버와 연결
const { sequelize } = require('./models');
const passportConfig = require('./passport'); // === require('./passport/index.js'); 폴더내의 index.js파일은 require시 이름 생략가능

const app = express();
//서버와연결 동기화
sequelize.sync();
passportConfig(passport);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8001); //앱을 8001포트에 연결

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET)); //비밀키 직접하드코딩 안함, 별도관리패키지 : dotenv 비밀키는 .env 라는 파일에 모아두고, dotenv가 .env파일을 읽어서 process.env 객체에 넣음
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'process.env.COOKIE_SECRET',
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(flash());
app.use(passport.initialize()); //initialize 미들웨어 == passport 설정을 심고
app.use(passport.session()); // session 미들웨어 == req.session 객체에 passport 정보를 저장, req.session 객체는 express-session에서 생성하는것이므로 passport 미들웨어는 express-session 미들웨어보다 뒤에 연결해야됨.

app.use('/', pageRouter);
app.use('/auth', authRouter); //kakaoStrategy.js 의 clientID부분을 발급 받기 위해 카카오개발자계정, 카카오용 앱이 필요. "https://developers.kakao.com" 에 가입
app.use('/post', postRouter);
app.use('/user', userRouter);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});



//6장 미들웨어 대부분을 사용
//라우트 이후 -> 404미들웨어, 에러 핸들링 미들웨어 





// * 스스로 해 볼 내용 *
// 1.팔로잉 끊기(시퀄라이즈의 destroy 메서드와 라우터 활용)
// 2.프로필 정보 변경하기(시퀄라이즈의 update 메서드와 라우터 활용)
// 3.게시글 좋아요 누르기 및 좋아요 취소하기(사용자-게시글 모델 간 n:m 관계 정립 후 라우터 활용)
// 4.게시글 삭제하기(등록자와 현재 로그인한 사용자가 같을 때 시퀄라이즈의 destroy메서드와 라우터 활용)
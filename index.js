const express = require("express");
const bodyParser = require("body-parser");
const {MongoClient} = require("mongodb");
const {engine} = require("express-handlebars");
const path = require("path");
const dayjs = require("dayjs");
const dotenv = require("dotenv");

dotenv.config({path: `${process.cwd()}/.env`});
const DB_HOST = process.env.DB_HOST || "localhost"
const PORT = process.env.PORT || 3000;


const getHomePage = require("./routes/getHomePage");
const queryBlog = require("./routes/queryBlog");
const getBlog = require("./routes/getBlog");
const getBlogs = require("./routes/getBlogs");
const getMemberList = require("./middleware/getMemberList");

dayjs().format();
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(process.cwd(), "public")));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));
let db;
app.use(async (req, res, next) => {
    if (!db) {
        const client = new MongoClient(
            `mongodb://${DB_HOST}/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000`
        );
        await client.connect();
        db = client.db("SakaBlog");
    }
    req.db = db;
    return next();
});

app.post("/query", queryBlog);
app.get("/:group/:member_id/:year/:month/blogs", getMemberList, getBlogs);
app.get("/:group/:member_id/:year/:month/blogs/:blog_id", getMemberList, getBlog)
app.get("/", getHomePage);

app.listen(PORT, () =>
    console.log(
        `Reader is ready. Please input http://localhost:${PORT}/ at browser to surfer blogs`
    )
);

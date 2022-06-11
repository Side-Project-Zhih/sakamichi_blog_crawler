const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const { engine } = require("express-handlebars");
const path = require("path");
const dayjs = require("dayjs");

const sakuraRouter = require("./routes/sakura");
const nogiRouter = require("./routes/nogi");
const hinataRouter = require("./routes/hinata");

dayjs().format();
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(async (req, res, next) => {
  const client = new MongoClient(
    "mongodb://localhost:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000"
  );
  await client.connect();
  const db = client.db("SakaBlog");
  req.db = db;
  return next();
});

app.post("/query", async (req, res) => {
  const { memberId, date, group } = req.body;
  const [year, month] = date.split("-");
  const dateObject = dayjs(date, "YYYY-MM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");

  const queryData = await req.db
    .collection("Blog")
    .find({
      group,
      memberId,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
    .project({ _id: 1 })
    .sort({ date: 1 })
    .limit(1)
    .toArray();

  let blogId = "";
  const blog = queryData[0];
  let redirectUrl = `http://localhost:3000/${group}/${memberId}/${year}/${month}/blogs`;
  if (blog) {
    blogId = blog._id.toString();
    redirectUrl = `http://localhost:3000/${group}/${memberId}/${year}/${month}/blogs/${blogId}`;
  }
  return res.redirect(redirectUrl);
});

app.use("/sakura", sakuraRouter);
app.use("/nogi", nogiRouter);
app.use("/hinata", hinataRouter);

app.get("/", async (req, res) => {
  const nogi = await req.db
    .collection("Member")
    .find({
      group: "nogi",
      date: {
        $exists: true,
      },
    })
    .sort({ memberId: 1 })
    .toArray();

  const sakura = await req.db
    .collection("Member")
    .find({
      group: "sakura",
      date: {
        $exists: true,
      },
    })
    .sort({ memberId: 1 })
    .toArray();

  const hinata = await req.db
    .collection("Member")
    .find({
      group: "hinata",
      date: {
        $exists: true,
      },
    })
    .sort({ memberId: 1 })
    .toArray();

  const memberList = {
    sakura,
    nogi,
    hinata
  };

  const now = dayjs(new Date()).format('YYYY-MM')

  return res.render("index", {
    webTitle: "BLOG SELECTOR",
    isIndex: true,
    memberList,
    jsonMemberList: JSON.stringify(memberList),
    now,
  });
});

app.listen(3000, () =>
  console.log(
    "Reader is ready. Please input http://localhost:3000/ at browser to surfer blogs"
  )
);

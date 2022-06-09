const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const { engine } = require("express-handlebars");
const dayjs = require("dayjs");
//import dayjs from 'dayjs' // ES 2015
dayjs().format();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.post("/", (req, res) => {
  res.send("fff");
});
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
  const [year, month] = date.split("-")
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
    // .project({ _id: 1 })
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

app.get("/sakura/:member_id/:year/:month/blogs/:blog_id", async (req, res) => {
  const { member_id, blog_id, year, month } = req.params;
  const dateObject = dayjs(`${year}${month}`, "YYYYMM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");
  const group = "sakura";

  const memberList = await req.db
    .collection("Member")
    .find({
      group,
      date: {
        $exists: true,
      },
    })
    .project({ _id: 0, name: 1, memberId: 1 })
    .sort({ memberId: 1 })
    .toArray();

  let targetMember;
  for (const member of memberList) {
    if (member.memberId === member_id) {
      targetMember = member;

      member.target = true;
      break;
    }
  }

  //query spec time blogs
  let blogs = await req.db
    .collection("Blog")
    .find({
      memberId: member_id,
      group: "sakura",
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
    .project({ content: 0, images: 0, group: 0 })
    .sort({ date: 1 })
    .toArray();

  blogs = blogs.map((blog) => {
    const title = blog.title;
    const id = blog._id.toString();
    const dateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
    const date = dateObject.format("YYYY/MM/DD");
    const url = `http://localhost:3000/sakura/${member_id}/${year}/${month}/blogs/${id}`;
    return {
      url,
      title,
      date,
    };
  });

  const blogObjectId = ObjectId(blog_id);
  const blog = await req.db.collection("Blog").findOne({
    _id: blogObjectId,
  });

  const blogDateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
  const { title, content } = blog;
  const blogYear = blogDateObject.year();
  const blogMonth = blogDateObject.month() + 1;
  const blogDay = blogDateObject.date();
  const date_time = blogDateObject.format("YYYY/MM/DD HH:mm:ss");
  const year_month = blogDateObject.format("YYYY-MM");
  //inject data

  return res.render("blog", {
    blogs,
    members: memberList,
    group,
    name: targetMember.name,
    title,
    content,
    showFooter: true,
    year_month,
    date_time,
    year: blogYear,
    month: blogMonth,
    day: blogDay,
  });
});

app.get("/sakura/:member_id/:year/:month/blogs", async (req, res) => {
  const { member_id, year, month } = req.params;
  const dateObject = dayjs(`${year}${month}`, "YYYYMM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");
  const group = "sakura";

  const memberList = await req.db
    .collection("Member")
    .find({
      group,
      date: {
        $exists: true,
      },
    })
    .project({ _id: 0, name: 1, memberId: 1 })
    .sort({ memberId: 1 })
    .toArray();

  let targetMember;
  for (const member of memberList) {
    if (member.memberId === member_id) {
      targetMember = member;

      member.target = true;
      break;
    }
  }

  //query spec time blogs
  let blogs = await req.db
    .collection("Blog")
    .find({
      memberId: member_id,
      group: "sakura",
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
    .project({ content: 0, images: 0, group: 0 })
    .sort({ date: 1 })
    .toArray();

  blogs = blogs.map((blog) => {
    const title = blog.title;
    const id = blog._id.toString();
    const dateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
    const date = dateObject.format("YYYY/MM/DD");
    const url = `http://localhost:3000/sakura/${member_id}/${year}/${month}/blogs/${id}`;
    return {
      url,
      title,
      date,
    };
  });

  const blogYear = year;
  const blogMonth = month;
  const blogDay = 1;
  const year_month = `${year}-${month}`;
  title = "該月份無發佈BLOG";
  //inject data

  res.render("blog", {
    blogs,
    members: memberList,
    group,
    name: targetMember.name,
    title,
    content: "<br><br>NONE",
    noContent: true,
    year: blogYear,
    month: blogMonth,
    day: blogDay,
    year_month,
  });
});

app.get("/nogi/:member_id/:year/:month/blogs/:blog_id", async (req, res) => {
  const { member_id, blog_id, year, month } = req.params;
  const dateObject = dayjs(`${year}${month}`, "YYYYMM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");
  const group = "nogi";

  const memberList = await req.db
    .collection("Member")
    .find({
      group,
      date: {
        $exists: true,
      },
    })
    .project({ _id: 0, name: 1, memberId: 1 })
    .sort({ memberId: 1 })
    .toArray();

  let targetMember;
  for (const member of memberList) {
    if (member.memberId === member_id) {
      targetMember = member;

      member.target = true;
      break;
    }
  }

  //query spec time blogs
  let blogs = await req.db
    .collection("Blog")
    .find({
      memberId: member_id,
      group,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
    .project({ content: 0, images: 0, group: 0 })
    .sort({ date: 1 })
    .toArray();

  blogs = blogs.map((blog) => {
    const title = blog.title;
    const id = blog._id.toString();
    const dateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
    const date = dateObject.format("YYYY/MM/DD");
    const url = `http://localhost:3000/${group}/${member_id}/${year}/${month}/blogs/${id}`;
    return {
      url,
      title,
      date,
    };
  });

  const blogObjectId = ObjectId(blog_id);
  const blog = await req.db.collection("Blog").findOne({
    _id: blogObjectId,
  });

  const blogDateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
  const { title, content } = blog;
  const blogYear = blogDateObject.year();
  const blogMonth = blogDateObject.month() + 1;
  const blogDay = blogDateObject.date();
  const date_time = blogDateObject.format("YYYY/MM/DD HH:mm:ss");
  const year_month = blogDateObject.format("YYYY-MM");
  //inject data

  return res.render("blog", {
    blogs,
    members: memberList,
    group,
    name: targetMember.name,
    title,
    content,
    showFooter: true,
    year_month,
    date_time,
    year: blogYear,
    month: blogMonth,
    day: blogDay,
  });
});

app.get("/nogi/:member_id/:year/:month/blogs", async (req, res) => {
  const { member_id, year, month } = req.params;
  const dateObject = dayjs(`${year}${month}`, "YYYYMM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");
  const group = "nogi";

  const memberList = await req.db
    .collection("Member")
    .find({
      group,
      date: {
        $exists: true,
      },
    })
    .project({ _id: 0, name: 1, memberId: 1 })
    .sort({ memberId: 1 })
    .toArray();

  let targetMember;
  for (const member of memberList) {
    if (member.memberId === member_id) {
      targetMember = member;

      member.target = true;
      break;
    }
  }

  //query spec time blogs
  let blogs = await req.db
    .collection("Blog")
    .find({
      memberId: member_id,
      group,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
    .project({ content: 0, images: 0, group: 0 })
    .sort({ date: 1 })
    .toArray();

  blogs = blogs.map((blog) => {
    const title = blog.title;
    const id = blog._id.toString();
    const dateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
    const date = dateObject.format("YYYY/MM/DD");
    const url = `http://localhost:3000/${group}/${member_id}/${year}/${month}/blogs/${id}`;
    return {
      url,
      title,
      date,
    };
  });

  const blogYear = year;
  const blogMonth = month;
  const blogDay = 1;
  const year_month = `${year}-${month}`;
  title = "該月份無發佈BLOG";
  //inject data

  res.render("blog", {
    blogs,
    members: memberList,
    group,
    name: targetMember.name,
    title,
    content: "<br><br>NONE",
    noContent: true,
    year: blogYear,
    month: blogMonth,
    day: blogDay,
    year_month,
  });
});

app.listen(3000, () => console.log("listen 3000"));

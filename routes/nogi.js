const express = require("express");
const dayjs = require("dayjs");
const { ObjectId } = require("mongodb");

dayjs().format();
router = express.Router();

router.use(async (req, res, next) => {
  const group = "nogi";

  req.group = group;

  const list = await req.db
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
  req.memberList = list;

  return next();
});

router.get("/:member_id/:year/:month/blogs/:blog_id", async (req, res) => {
  const { member_id, blog_id, year, month } = req.params;
  const dateObject = dayjs(`${year}${month}`, "YYYYMM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");

  const { group } = req;

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

router.get("/:member_id/:year/:month/blogs", async (req, res) => {
  const { member_id, blog_id, year, month } = req.params;
  const dateObject = dayjs(`${year}${month}`, "YYYYMM");
  const startDate = dateObject.format("YYYYMM01000000");
  const endDate = dateObject.add(1, "M").format("YYYYMM01000000");

  const { group } = req;

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

module.exports = router;

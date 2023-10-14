const dayjs = require("dayjs");
const GROUP_NAME_MAP = require("./constant/GROUP_NAME_MAP");

async function getBlogs(req, res) {
    const {group, member_id, year, month} = req.params;
    const dateObject = dayjs(`${year}${month}`, "YYYYMM");
    const startDate = dateObject.format("YYYYMM01000000");
    const endDate = dateObject.add(1, "M").format("YYYYMM01000000");


    const memberList = req.memberList;

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
        .project({content: 0, images: 0, group: 0})
        .sort({date: 1})
        .toArray();

    blogs = blogs.map((blog) => {
        const title = blog.title;
        const id = blog._id.toString();
        const dateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
        const date = dateObject.format("YYYY/MM/DD");
        const url = `/${group}/${member_id}/${year}/${month}/blogs/${id}`;
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
    const webTitle = `${GROUP_NAME_MAP[group] || group} ${targetMember.name}`;
    title = "該月份無發佈BLOG";
    //inject data

    res.render("blog", {
        webTitle,
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
}


module.exports = getBlogs
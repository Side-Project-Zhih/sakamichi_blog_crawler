const dayjs = require("dayjs");
const {ObjectId} = require("mongodb");
const GROUP_NAME_MAP = require("./constant/GROUP_NAME_MAP");

dayjs().format();

async function getBlog(req, res) {
    const {group, member_id, blog_id, year, month} = req.params;
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

    const blogObjectId = ObjectId(blog_id);
    const blog = await req.db.collection("Blog").findOne({
        _id: blogObjectId,
    });

    const blogDateObject = dayjs(blog.date, "YYYYMMDDHHmmss");
    const {title, content} = blog;
    const blogYear = blogDateObject.year();
    const blogMonth = blogDateObject.month() + 1;
    const blogDay = blogDateObject.date();
    const date_time = blogDateObject.format("YYYY/MM/DD HH:mm:ss");
    const year_month = blogDateObject.format("YYYY-MM");
    const groupName = GROUP_NAME_MAP[group] || group;
    const webTitle = `${groupName} ${targetMember.name}`;


    return res.render("blog", {
        webTitle,
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
}


module.exports = getBlog;

const dayjs = require("dayjs");

async function queryBlog(req, res) {
    const {memberId, date, group} = req.body;
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
        .project({_id: 1})
        .sort({date: 1})
        .limit(1)
        .toArray();

    let blogId = "";
    const blog = queryData[0];
    let redirectUrl = `/${group}/${memberId}/${year}/${month}/blogs`;
    if (blog) {
        blogId = blog._id.toString();
        redirectUrl = `/${group}/${memberId}/${year}/${month}/blogs/${blogId}`;
    }
    return res.redirect(redirectUrl);
}

module.exports = queryBlog;
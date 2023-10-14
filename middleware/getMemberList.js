async function getMemberList(req, res, next) {
    const {group} = req.params;
    const list = await req.db
        .collection("Member")
        .find({
            group,
            date: {
                $exists: true,
            },
        })
        .project({_id: 0, name: 1, memberId: 1})
        .sort({memberId: 1})
        .toArray();
    req.memberList = list;

    return next();
}

module.exports = getMemberList;
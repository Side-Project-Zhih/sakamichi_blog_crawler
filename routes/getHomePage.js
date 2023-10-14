const dotenv = require("dotenv");
const GROUP_NAME_MAP = require("./constant/GROUP_NAME_MAP");
const envPath = `${process.cwd()}/.env`;
dotenv.config({path: envPath});

const defaultDisplayGroup = process.env.DEFAULT_DISPLAY_GROUP || "sakura";
const dayjs = require("dayjs");

function getAllGroupPipeline() {
    return [
        {
            $match: {
                date: {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                group: 1,
                memberId: 1,
            },
        },
        {
            $unset: ["_id"],
        },
        {
            $project: {
                group: 1,
                memberId: 1,
                name: 1,
            },
        },
        {
            $group: {
                _id: "$group",
                members: {
                    $push: {
                        member_id: "$memberId",
                        name: "$name",
                    },
                },
            },
        },
    ];
}


async function getGroupNames(db) {
    const groupNames = (await db.collection('Member').aggregate([
        {
            $group: {
                _id: "$group",
                name: {
                    $first: "$group"
                }
            }
        },
        {
            $project: {
                _id: 0,
            }
        }
    ]).toArray()).map(group => ({
        value: group.name,
        name: GROUP_NAME_MAP[group.name] || group.name,
        select: group.name === defaultDisplayGroup ? "selected" : ""
    }))
    return groupNames;
}

async function getGroupMemberMap(db) {
    const pipeline = getAllGroupPipeline();
    const groups = await db.collection("Member").aggregate(pipeline).toArray();
    const memberList = {};
    for (const group of groups) {
        group.members.sort((a, b) => +a.memberId - +b.memberId);
        if (group) {
            memberList[group._id] = group.members;
        }
    }
    return memberList;
}

async function getHomePage(req, res) {
    const groupNames = await getGroupNames(req.db);
    const memberMap = await getGroupMemberMap(req.db);
    const now = dayjs().format("YYYY-MM");
    const defaultMemberList = memberMap[defaultDisplayGroup];

    return res.render("index", {
        webTitle: "BLOG SELECTOR",
        isIndex: true,
        memberList: memberMap,
        jsonMemberList: JSON.stringify(memberMap),
        now,
        groupNames,
        defaultMemberList
    });
}

module.exports = getHomePage;
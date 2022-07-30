"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongodbStoreCrawler = void 0;
const DbStoreTemplate_1 = require("./DbStoreTemplate");
const mongodb_1 = require("mongodb");
const axios_1 = __importDefault(require("axios"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
const DATE_FORMAT = "YYYYMMDD000000";
class MongodbStoreCrawler extends DbStoreTemplate_1.DbStoreTemplate {
    constructor(url, dbName) {
        super();
        this.url = url;
        this.dbName = dbName;
        this.client = new mongodb_1.MongoClient(this.url);
    }
    async connectClient() {
        await this.client.connect();
        const db = this.client.db(this.dbName);
        this.db = db;
    }
    async dbInit() {
        await this.client.connect();
        const db = this.client.db(this.dbName);
        this.db = db;
    }
    async dbQuerytMembers(members, groupName) {
        if (this.db === undefined) {
            throw new Error();
        }
        const data = await this.db
            .collection("Member")
            .find({
            memberId: {
                $in: members,
            },
            group: groupName,
        })
            .toArray();
        return data;
    }
    async dbBulkUpsertBlog(memberId, groupName, dataList) {
        if (this.db === undefined) {
            throw new Error();
        }
        const blogsContentList = dataList.map((blog) => ({
            updateOne: {
                filter: { memberId, group: groupName, date: blog.date },
                update: {
                    $set: {
                        group: groupName,
                        memberId,
                        content: blog.content,
                        title: blog.title,
                        date: blog.date,
                        images: blog.images,
                    },
                },
                upsert: true,
            },
        }));
        try {
            await this.db.collection("Blog").bulkWrite(blogsContentList);
        }
        catch (error) {
            console.log(error);
        }
    }
    async dbUpdateMember(memberId, groupName, data) {
        if (this.db === undefined) {
            throw new Error();
        }
        const now = data.date;
        try {
            await this.db.collection("Member").updateOne({
                memberId,
                group: groupName,
            }, {
                $set: {
                    date: now,
                },
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    async dbUpdateInitMemberList(group) {
        if (typeof group !== "string" || this.db === undefined) {
            throw new Error();
        }
        let api;
        switch (group) {
            case "sakura": {
                api = "https://sakurazaka46.com/s/s46app/api/json/diary?cd=blog&mode=C";
                break;
            }
            case "nogi": {
                api =
                    "https://www.nogizaka46.com/s/n46/api/json/diary?cd=MEMBER&mode=C";
                break;
            }
            case "hinata": {
                api =
                    "https://www.hinatazaka46.com/s/h46app/api/json/diary?cd=member&mode=C";
                break;
            }
        }
        api = api;
        const res = await axios_1.default.get(api);
        const data = res.data.blog;
        const list = data.map((member) => {
            const { member_id, creator } = member;
            return {
                updateOne: {
                    filter: {
                        memberId: member_id,
                        group,
                    },
                    update: {
                        $set: {
                            memberId: member_id,
                            group,
                            name: creator,
                        },
                    },
                    upsert: true,
                },
            };
        });
        await this.db.collection("Member").bulkWrite(list);
    }
    async dbGetMemberList(group) {
        if (this.db === undefined) {
            throw new Error();
        }
        const data = await this.db
            .collection("Member")
            .find({
            group,
        })
            .project({
            memberId: 1,
            name: 1,
            _id: 0,
        })
            .sort({ memberId: 1 })
            .toArray();
        return data;
    }
    async dbGetMembersBlogs(groupName, members, date) {
        if (this.db === undefined) {
            throw new Error();
        }
        const dateObject = (0, dayjs_1.default)(date, "YYYYMM");
        if (dateObject.isValid() === false) {
            throw new Error();
        }
        let startDate = dateObject.format(DATE_FORMAT);
        let endDate = dateObject
            .add(1, "month")
            .format(DATE_FORMAT);
        const criteria = {
            group: groupName,
            memberId: {
                $in: members,
            },
        };
        if (date) {
            criteria.date = {
                $gte: startDate,
                $lt: endDate,
            };
        }
        const data = (await this.db
            .collection("Blog")
            .find(criteria)
            .project({
            images: 1,
            _id: 0,
        })
            .toArray());
        return data;
    }
}
exports.MongodbStoreCrawler = MongodbStoreCrawler;
//# sourceMappingURL=MongodbStoreCrawler.js.map
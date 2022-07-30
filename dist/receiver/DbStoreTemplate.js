"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbStoreTemplate = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const SakuraFactory_1 = require("../groupFactory/SakuraFactory");
const NogiFactory_1 = require("../groupFactory/NogiFactory");
const HinataFactory_1 = require("../groupFactory/HinataFactory");
const { downloadImage } = require("../util/download");
dayjs_1.default.extend(utc_1.default);
const ERROR_MESSAGE = {
    inputAllNumber: "Please input series number",
    wrongGroupName: "Please input correct group name",
};
class DbStoreTemplate {
    async downloadMultiMembersBlog(groupName, members) {
        await this.dbInit();
        await (0, mkdirp_1.default)(`${process.cwd()}/public`);
        await this.dbUpdateInitMemberList(groupName);
        let factory;
        switch (groupName) {
            case "sakura": {
                factory = new SakuraFactory_1.SakuraFactory();
                break;
            }
            case "nogi": {
                factory = new NogiFactory_1.NogiFactory();
                break;
            }
            case "hinata": {
                factory = new HinataFactory_1.HinataFactory();
                break;
            }
            default: {
                factory;
            }
        }
        if (factory === undefined) {
            throw new Error(ERROR_MESSAGE.wrongGroupName);
        }
        const group = factory.newInstance();
        for (const member of members) {
            if (typeof +member !== "number") {
                throw new Error(ERROR_MESSAGE.inputAllNumber);
            }
        }
        // query member
        const memberList = (await this.dbQuerytMembers(members, groupName));
        let count = "1000";
        const now = dayjs_1.default
            .utc(new Date())
            .utcOffset(9)
            .format("YYYYMMDDHHmmss");
        for (const memberId of members) {
            const member = memberList.find((item) => item.memberId === memberId);
            console.log(`${member.name}'s blogs start download `);
            const eventName = `finish ${member.name} download`;
            const isFirstTime = member.date === undefined;
            let fromDate = member.date;
            let timeStatus = "new";
            /** time count start */
            console.time(eventName);
            /** ----------------- */
            await (0, mkdirp_1.default)(`${process.cwd()}/public/${groupName}/${member.name}`);
            if (isFirstTime) {
                fromDate = now;
                timeStatus = "old";
                count = await group.getBlogsTotalCount(memberId, now);
            }
            fromDate = fromDate;
            const { blogs, total } = await group.getBlogs(memberId, {
                count,
                timeStatus,
                fromDate,
            });
            if (total === 0) {
                console.log(`${member.name}'s blogs have already updated to latest `);
                continue;
            }
            console.log(`Blog counts: ${total}`);
            //store content in db
            await this.dbBulkUpsertBlog(memberId, groupName, blogs);
            //downloadImages
            for (const blog of blogs) {
                const images = blog.images;
                const imageRunList = images.map(async (image) => await downloadImage(image));
                await Promise.allSettled(imageRunList);
            }
            //udpate member last updated
            await this.dbUpdateMember(memberId, groupName, {
                date: now,
            });
            /** time count end */
            console.timeEnd(eventName);
            /** ----------------- */
        }
    }
    async getMemberList(group) {
        await (0, mkdirp_1.default)(`${process.cwd()}/public`);
        // =================template=========================
        await this.dbInit();
        await this.dbUpdateInitMemberList(group);
        const list = await this.dbGetMemberList(group);
        // ==========================================
        return console.log(list);
    }
    async getBackImages(groupName, members, date) {
        await (0, mkdirp_1.default)(`${process.cwd()}/public`);
        await this.dbInit();
        const blogs = await this.dbGetMembersBlogs(groupName, members, date);
        for (const blog of blogs) {
            const images = blog.images;
            await Promise.allSettled(images.map(async (image) => await downloadImage(image)));
        }
    }
}
exports.DbStoreTemplate = DbStoreTemplate;
//# sourceMappingURL=DbStoreTemplate.js.map
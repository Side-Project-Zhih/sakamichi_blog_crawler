"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SakuraFactory = void 0;
const SakuraApi_1 = require("../api/SakuraApi");
const axios_1 = __importDefault(require("axios"));
const jsdom_1 = require("jsdom");
class SakuraFactory {
    constructor() {
        this.groupName = "sakura";
        this.api = new SakuraApi_1.SakuraApi();
    }
    newInstance() {
        return new SakuraFactory();
    }
    async getBlogs(memberId, { count, fromDate, timeStatus, }) {
        const limit = 200;
        const round = Math.ceil(+count / limit);
        const output = [];
        let lastBlogDate = fromDate;
        let total = 0;
        for (let i = 0; i < round; i++) {
            const api = this.api.GET_BLOGS_API(memberId, {
                count: "" + limit,
                fromDate: lastBlogDate,
                timeStatus,
                mode: "B",
            });
            const res = await axios_1.default.get(api);
            const data = res.data;
            const blogs = data.blog;
            if (blogs.length === 0) {
                break;
            }
            for (const blog of blogs) {
                const { title, content, creator } = blog;
                const dir = `${this.groupName}/${creator}`;
                const date = blog.pubdate.replace(/[/: ]/g, "");
                const document = new jsdom_1.JSDOM(content).window.document;
                const picsElem = document.querySelectorAll("img");
                const pics = [];
                picsElem.forEach((item) => pics.push(item));
                const images = [];
                for (let i = 0; i < pics.length; i++) {
                    const pic = pics[i];
                    const filename = `${date}_image_${i}.jpg`;
                    const src = pic.src;
                    pic.src = `/${dir}/${filename}`;
                    images.push({
                        filename,
                        src,
                        dir,
                    });
                }
                output.push({
                    title,
                    date,
                    content: document.body.outerHTML,
                    images: images,
                });
            }
            //handle total blogs
            if (i === 0) {
                total = blogs.length;
            }
            else {
                total += blogs.length - 1;
            }
            // don't do unnecessary request
            if (blogs.length < limit) {
                break;
            }
            //handle last blog date index
            let lastBlogDateIndex = 0;
            switch (timeStatus) {
                case "old": {
                    lastBlogDateIndex = blogs.length - 1;
                    break;
                }
                case "new": {
                    lastBlogDateIndex = 0;
                    break;
                }
            }
            lastBlogDate = blogs[lastBlogDateIndex].pubdate.replace(/[/: ]/g, "");
        }
        return {
            blogs: output,
            total,
        };
    }
    async getBlogsTotalCount(memberId, fromDate) {
        const api = this.api.GET_BLOGS_API(memberId, {
            count: "1",
            fromDate,
            timeStatus: "old",
            mode: "C",
        });
        const res = await axios_1.default.get(api);
        const data = res.data;
        const count = data.count;
        return count;
    }
}
exports.SakuraFactory = SakuraFactory;
//# sourceMappingURL=SakuraFactory.js.map
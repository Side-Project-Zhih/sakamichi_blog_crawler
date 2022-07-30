"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HinataFactory = void 0;
const HinataApi_1 = require("../api/HinataApi");
const axios_1 = __importDefault(require("axios"));
const jsdom_1 = require("jsdom");
class HinataFactory {
    constructor() {
        this.groupName = "hinata";
        this.api = new HinataApi_1.HinataApi();
    }
    newInstance() {
        return new HinataFactory();
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
            //handle last blog date
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
exports.HinataFactory = HinataFactory;
//# sourceMappingURL=HinataFactory.js.map
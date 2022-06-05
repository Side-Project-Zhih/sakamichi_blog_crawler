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
        this.api = new SakuraApi_1.SakuraApi();
    }
    newInstance() {
        return new SakuraFactory();
    }
    async getBlogs(memberId, { count, fromDate, timeStatus, }) {
        const api = this.api.GET_BLOGS_API(memberId, {
            count,
            fromDate,
            timeStatus,
        });
        const res = await axios_1.default.get(api);
        const data = res.data;
        const blogs = data.blog;
        const output = [];
        for (const blog of blogs) {
            const { title, content, creator } = blog;
            const dir = creator;
            const date = blog.pubdate.replace(/[/: ]/g, "");
            const document = new jsdom_1.JSDOM(content).window.document;
            const picsElem = document.querySelectorAll("img");
            const pics = [];
            picsElem.forEach((item) => pics.push(item));
            const images = [];
            for (let i = 0; i < pics.length; i++) {
                const pic = pics[i];
                const filename = `${dir}/${date}_image_${i}.jpg`;
                const src = pic.src;
                pic.src = filename;
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
        return output;
    }
}
exports.SakuraFactory = SakuraFactory;

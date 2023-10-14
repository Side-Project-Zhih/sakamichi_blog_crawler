import Crawler, {Image} from "./Crawler";
import {RawBlog} from "./ApiCrontroller/ApiController";

export default class NotEqualMeCrawler extends Crawler {

    protected getNewLastUpdate(rawBlogs: RawBlog[], now: string): string {
        const lastBlog = rawBlogs[0];
        return lastBlog.date;
    }

    protected parseContent(blogDom: Document): string {
        const content = blogDom.querySelector('.text');
        return content?.outerHTML as string;
    }

    protected parseTitle(rawBlog: RawBlog, blogDom: Document): string {
        const title = blogDom.querySelector('.titArea .tit');
        return title?.textContent || "";
    }

    protected parseImagesAndBlogDom(dir: string, date: string, blogDom: Document,) {
        const picsElem = blogDom.querySelectorAll(".text img");
        const pics: HTMLImageElement[] = [];
        picsElem.forEach((item) => pics.push(<HTMLImageElement>item));
        const images = pics.map<Image>((pic, i) => {
            const filename = `${date}_image_${i}.jpg`;
            const src = pic.src;
            pic.src = `/${dir}/${filename}`;
            return {
                filename,
                src,
                dir,
            };
        });


        return {
            images,
            blogDom
        };
    }
}
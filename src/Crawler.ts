import ApiController, {RawBlog} from "./ApiCrontroller/ApiController";
import mkdirp from "mkdirp";
import {JSDOM} from "jsdom";
import Database from "./database/Database";
import Downloader from "./Downloader";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export type KeyValueMap = {
    [key: string]: string;
}

export type Image = {
    filename: string,
    src: string,
    dir: string,
};

export type Blog = {
    title: string,
    date: string,
    content: string,
    images: Image[],
}

export default class Crawler {
    constructor(private apiController: ApiController, private db: Database, private downloader: Downloader) {
    }

    async execute(memberIds: string[]) {
        await mkdirp(`${process.cwd()}/public`);
        const group = this.apiController.group;
        const isMemberListExist = await this.db.checkMemberList(group);
        if (!isMemberListExist) {
            await this.upsertMemberList();
        }
        const members = await this.db.getMembers(group, memberIds);
        for (const memberId of memberIds) {
            const member = members.find(member => member.memberId === memberId);
            if (member === undefined) {
                console.log(`memberId:${memberId} is not found`);
                continue;
            }
            const event = `crawl memberId: ${memberId} name: ${member.name}`;
            console.log(`${event} start`);
            console.time(`${event} finished`);
            await mkdirp(`${process.cwd()}/public/${this.apiController.group}/${member.name}`);

            const now = dayjs().utc().local().format("YYYYMMDDHHmmss");
            const lastUpdate = this.getLastUpdate({date: member.date, now: now});
            const queryPrams = this.getQueryParams({now});
            const rawBlogs = await this.apiController.getBlogs(memberId, lastUpdate, queryPrams);

            if (rawBlogs.length === 0) {
                console.log(`${event} no new blogs`);
                console.timeEnd(`${event} finished`);
                continue;
            }

            const newLastUpdate = this.getNewLastUpdate(rawBlogs, now);

            const blogs = this.parseRawBlogs(member.name, rawBlogs);
            console.log(`blogs counts ${blogs.length}`);

            await this.db.insertBlogs(group, memberId, blogs);
            const images = blogs.flatMap(blog => blog.images);
            await this.downloader.downloadImages(images);

            await this.db.updateMember(group, memberId, {date: newLastUpdate});

            console.timeEnd(`${event} finished`);
        }

        console.log("all finished");
    }

    public async getMemberList() {
        const group = this.apiController.group;
        await mkdirp(`${process.cwd()}/public`);
        const isMemberListEmpty = await this.db.checkMemberList(group);
        if (isMemberListEmpty) {
            await this.upsertMemberList();
        }
        const list = await this.db.getMemberList(group);
        console.log(list);
    }

    protected getQueryParams(params: { now: string }): KeyValueMap {
        return {now: params.now};
    }

    protected parseTitle(rawBlog: RawBlog, blogDom: Document): string {
        return rawBlog.title;
    }


    protected getLastUpdate({date, now}: { date?: string, now: string }): string {
        if (date === undefined) {
            return "";
        }
        return date;
    }

    protected getNewLastUpdate(rawBlogs: RawBlog[], now: string) {
        return now
    }

    protected parseDate(rawBlog: RawBlog) {
        return rawBlog.date;
    }

    protected parseContent(blogDom: Document) {
        return blogDom.body.outerHTML;
    }

    protected parseImagesAndBlogDom(dir: string, date: string, blogDom: Document,) {
        const picsElem = blogDom.querySelectorAll("img");
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

    private parseRawBlogs(name: string, rawBlogs: RawBlog[]) {
        const dir = `${this.apiController.group}/${name}`;

        return rawBlogs.map(rawBlog => {
            let blogDom = new JSDOM(rawBlog.content).window.document;
            const date = this.parseDate(rawBlog);
            const cookie = rawBlog.cookie;

            const result = this.parseImagesAndBlogDom(dir, date, blogDom);
            const images = result.images;
            blogDom = result.blogDom;
            const title = this.parseTitle(rawBlog, blogDom);
            const content = this.parseContent(blogDom);

            return {
                title,
                date,
                content,
                images
            };
        });
    }

    private async upsertMemberList() {
        const group = this.apiController.group;
        const members = await this.apiController.getMemberList();
        await this.db.upsertMemberList(group, members);
    }

    private async downloadImages(images: Image[]) {


    }
}
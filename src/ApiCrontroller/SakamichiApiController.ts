import ApiController, {Member, RawBlog} from "./ApiController";
import {KeyValueMap} from "../Crawler";
import axios from "axios";

export type ApiSetting = {
    GET_MEMBER_LIST: string,
    group: string,
    GET_BLOGS: string,
}
export default class SakamichiApiController extends ApiController {

    group: string;
    private readonly GET_MEMBER_LIST: string;
    private readonly GET_BLOGS: string;

    constructor(apiSetting: ApiSetting) {
        super();
        this.group = apiSetting.group;
        this.GET_MEMBER_LIST = apiSetting.GET_MEMBER_LIST;
        this.GET_BLOGS = apiSetting.GET_BLOGS;
    }


    async getMemberList(): Promise<Member[]> {
        const url = this.GET_MEMBER_LIST;
        const group = this.group;
        const res = await axios.get <{ blog: KeyValueMap[] }
        >(url);
        const data = res.data.blog;

        return data.map((member) => {
            const {member_id, creator} = member;
            return {
                memberId: member_id,
                group,
                name: creator,
            };
        });
    }

    async getBlogs<QueryParams>(memberId: string, lastUpdate: string, params?: QueryParams): Promise<RawBlog[]> {
        const timeStatus = lastUpdate ? "new" : "old";
        const count = await this.getBlogCount(memberId, timeStatus, lastUpdate, params as { now: string });
        const batchSize = 200;
        const round = Math.ceil(count / batchSize);
        const blogs: RawBlog[] = [];
        let lastBlogDate: string = lastUpdate;

        for (let i = 0; i < round; i++) {
            const url = this.getBlogUrl({
                memberId,
                fromDate: lastBlogDate,
                count: batchSize,
                timeStatus,
                mode: "B",
            });
            const res = await axios.get<{
                blog: {
                    title: string,
                    pubdate: string,
                    content: string,
                }[]
            }>(url);
            const rawBlogs = res.data.blog;
            if (rawBlogs.length === 0) {
                break;
            }
            const formattedBlogs = rawBlogs.map<RawBlog>(rawBlog => {
                const {title, pubdate, content} = rawBlog;
                const date = pubdate.replace(/[/: ]/g, "");
                return {
                    title,
                    date,
                    content,
                };
            });
            blogs.push(...formattedBlogs);

            if (formattedBlogs.length < batchSize) {
                break;
            }

            lastBlogDate = this.getLatestBlogDate(timeStatus, formattedBlogs);
        }

        return blogs.sort((a, b) => Number(a.date) - Number(b.date));
    }

    private getLatestBlogDate(timeStatus: string, formattedBlogs: RawBlog[]) {
        //handle last blog date index
        let lastBlogDateIndex: number = 0;
        switch (timeStatus) {
            case "old": {
                lastBlogDateIndex = formattedBlogs.length - 1;
                break;
            }
            case "new": {
                lastBlogDateIndex = 0;
                break;
            }
        }

        return formattedBlogs[lastBlogDateIndex].date;
    }

    private getBlogUrl(param: { fromDate: string; mode: string; count: number; timeStatus: string; memberId: string }) {
        const url = new URL(this.GET_BLOGS);
        url.searchParams.set("member_id", param.memberId);
        url.searchParams.set("fromdate", param.fromDate);
        url.searchParams.set("get", param.mode);
        url.searchParams.set("getnum", String(param.count));
        url.searchParams.set("timestatus", param.timeStatus);
        return url.toString();
    }

    private async getBlogCount(memberId: string, timeStatus: string, lastUpdate: string, params: {
        now: string;
    }) {
        if (timeStatus === "new") {
            return 1000;
        }

        const {now} = params;
        const fromDate = lastUpdate ? lastUpdate : now;

        const url = this.getBlogUrl({
            memberId,
            fromDate,
            count: 1,
            timeStatus,
            mode: "C",
        });

        const res = await axios.get<{
            count: string
        }>(url);

        const count = res.data.count;
        return Number(count);
    }
}
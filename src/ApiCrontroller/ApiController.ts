import {ApiSetting} from "./SakamichiApiController";

export type Member = {
    memberId: string,
    name: string,
    group: string,
    date?: string,
    image?: string,
}

export type RawBlog = {
    title: string,
    date: string,
    content: string,
    cookie?: string,
}
export default class ApiController {
    group: string = "";

    constructor(api?: ApiSetting) {
    }

    getMemberList(): Promise<Member[]> {
        throw new Error("Method not implemented.");
    }

    getBlogs<QueryParams>(memberId: string, lastUpdate: string, params?: QueryParams): Promise<RawBlog[]> {

        throw new Error("Method not implemented.");
    }
}
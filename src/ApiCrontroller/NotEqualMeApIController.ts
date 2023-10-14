import ApiController, {Member, RawBlog} from "./ApiController";
import request, {Options} from "request";
import axios from "axios";
import dayjs from "dayjs";
import cookieParser from "cookie";
import {ApiSetting} from "./SakamichiApiController";
import * as dotenv from "dotenv";

const envPath = `${process.cwd()}/.env`;
dotenv.config({path: envPath});

const DATE_FORMAT = "YYYYMMDDHHmmss";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function requestPromise(options: Options) {
    // @ts-ignore
    return new Promise((res, rej) => {
        request(options, function (err, response) {
            if (err) return rej(err);
            res(response);
        });
    });
}

export default class NotEqualMeApIController extends ApiController {
    public group = "notEqualMe";
    private blogListApi = "https://appi.emtg.jp/new-app/v2/blog/list?app_id=231&service_id=275&site_id=1&artist_id=1";
    private memberListApi = "https://appi.emtg.jp/new-app/v2/blog/category?app_id=231&service_id=275&site_id=1&artist_id=1";
    private loginApi = "https://secure.plusmember.jp/notequalme/1/login/";
    private token?: string;

    constructor(api?: ApiSetting) {
        super();
    }

    async getBlogs<QueryParams>(memberId: string, lastUpdate: string, params?: QueryParams): Promise<RawBlog[]> {
        const url = new URL(this.blogListApi);
        const limit = 100;
        url.searchParams.set("category_id", memberId);
        url.searchParams.set('limit', String(limit));
        let page = 1;
        const headers = {
            'X_SMARTPHONE_UID': 'a174bf6ae1f5b035dbf4ff3bc33c868d',
            'X_SMARTPHONE_AID': '9958a70938f91038409f6d9edbcc46c0',
        };
        let targetBlogs = [] as { id: string, start_time: string, detail_url: string }[];


        while (true) {
            url.searchParams.set('page', String(page));
            const response = await axios.get(url.toString(), {headers});
            const data = response.data as { id: string, start_time: string, detail_url: string }[];
            if (!data?.at(0) || !data) {
                break;
            }
            targetBlogs.push(...data);
            if (data.length < limit) {
                break;
            }
            page++;
        }

        if (lastUpdate) {
            targetBlogs = targetBlogs.filter(blog => dayjs(blog.start_time).isAfter(dayjs(lastUpdate,
                DATE_FORMAT)));
        }


        const cookie = await this.getToken();
        const blogList = [] as RawBlog[];


        const batchSize = 10;
        const batchCount = Math.ceil(targetBlogs.length / batchSize);
        for (let i = 0; i < batchCount; i++) {
            let batch = targetBlogs.slice(i * batchSize, (i + 1) * batchSize);
            while (batch.length > 0) {
                const batchBlogList = await Promise.allSettled(batch.map(blog =>
                    this.getBlog(blog, cookie)
                ));
                const failedBlogList = [] as { id: string, start_time: string, detail_url: string }[];
                batchBlogList.forEach((result, i) => {
                    if (result.status === 'rejected') {
                        failedBlogList.push(batch[i]);
                        return;
                    }
                    blogList.push(result.value);
                });
                console.log(`failedBlogList: ${failedBlogList.length}`);
                batch = failedBlogList;
            }
        }

        return blogList.sort((a, b) => +b.date - +a.date);
    }

    async getMemberList(): Promise<Member[]> {
        const headers = {
            'Host': 'appi.emtg.jp',
            'Accept-Encoding': 'gzip, deflate, br',
            'X_SMARTPHONE_UID': 'a174bf6ae1f5b035dbf4ff3bc33c868d',
            'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148boundary X-SMARTPHONE-UID:a174bf6ae1f5b035dbf4ff3bc33c868d;X-SMARTPHONE-AID:9958a70938f91038409f6d9edbcc46c0;X-APP-VERSION:1.1.4;X-APP-ID:231',
            'X_SMARTPHONE_AID': '9958a70938f91038409f6d9edbcc46c0'
        };
        const response =
            await axios.get(this.memberListApi, {
                headers
            });

        const data = response.data as {
            category_id: string,
            category_name: string,
        }[];

        return data.map(item => ({
            memberId: item.category_id,
            name: item.category_name,
            group: this.group,
        }));
    }

    private async getToken(): Promise<string> {
        const options = {
            method: 'POST',
            url: 'https://secure.plusmember.jp/notequalme/1/login/',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/x-www-form-urlencoded',
                'pragma': 'no-cache',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            },
            form: {
                'form[id]': process.env.NOT_EQUAL_ME_ACCOUNT,
                'form[pass]': process.env.NOT_EQUAL_ME_PASSWORD,
            }
        };
        const response = await requestPromise(options);
        // @ts-ignore
        const setCookies = response.headers['set-cookie'];
        if (!setCookies || setCookies.length === 0) {
            throw new Error('cannot get cookie');
        }

        const targetKey = 'sp.not-equal-me.jp';
        const targetSetCookie = setCookies.find((cookie: string) => cookie.includes(targetKey));
        const parsedCookie = cookieParser.parse(targetSetCookie);
        const cookie = `${targetKey}=${parsedCookie[targetKey]};`;
        if (!cookie) {
            throw new Error('cannot get cookie');
        }
        return cookie;
    }

    private async getBlog(blog: {
        id: string,
        start_time: string,
        detail_url: string
    }, cookie: string): Promise<RawBlog> {

        const headers = {
            cookie,
            'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        };
        const response = await axios.get(blog.detail_url, {headers, timeout: 2000});
        const data = response.data as string;
        const date = dayjs(blog.start_time).format(DATE_FORMAT);
        return {
            title: '',
            date,
            content: data,
        };
    }
}
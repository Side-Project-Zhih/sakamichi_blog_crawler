import yargs from "yargs";
import MongoDatabase from "./database/MongoDatabase";
import Crawler from "./Crawler";
import NotEqualMeCrawler from "./NotEqualMeCrawler";
import NotEqualMeApIController from "./ApiCrontroller/NotEqualMeApIController";
import ApiController from "./ApiCrontroller/ApiController";
import Downloader from "./Downloader";
import * as dotenv from "dotenv";
import {SakuraApi} from "./api/SakuraApi";
import {HinataApi} from "./api/HinataApi";
import SakamichiApiController, {ApiSetting} from "./ApiCrontroller/SakamichiApiController";
import {NogiApi} from "./api/NogiApi";

const envPath = `${process.cwd()}/.env`;
dotenv.config({path: envPath});


const COMMANDS = {
    group: {
        alias: "g",
        describe: "chose group sakura / nogi / hinata ex: -g sakura",
        string: true,
    },
    members: {
        alias: "m",
        describe:
            "input member id ex: -m 21, if you want to download  multiple members please input ex: -m 21 11",
        array: true,
        string: true,
    },
    show: {
        alias: "s",
        describe: "show group memberIds",
        string: true,
    },
    date: {
        alias: "d",
        describe: "input spec date,format should be 'YYYYMM' ex: -d 202205",
        string: true,
    },
};


const args = yargs.options(COMMANDS).help().argv as {
    group: string;
    members: Array<string>;
    show: string;
    date: string;
};

const CRAWL_MAP: { [group: string]: typeof Crawler } = {
    "notEqualMe": NotEqualMeCrawler,
    "sakura": Crawler,
    "nogi": Crawler,
    "hinata": Crawler
};
const API_CONTROLLER_MAP: { [group: string]: typeof ApiController } = {
// @ts-ignore
    "notEqualMe": NotEqualMeApIController,
// @ts-ignore
    "sakura": SakamichiApiController,
// @ts-ignore
    "nogi": SakamichiApiController,
// @ts-ignore
    "hinata": SakamichiApiController
};

const API_MAP: { [group: string]: ApiSetting } = {
    sakura: SakuraApi,
    nogi: NogiApi,
    hinata: HinataApi
};


const DB_HOST = process.env.DB_HOST || 'localhost';

async function main() {
    const mongodbStore = new MongoDatabase(
        `mongodb://${DB_HOST}:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000`,
        "SakaBlog"
    );
    const group = args.group || args.show;
    if (group === undefined) {
        throw new Error("Please input group name");
    }
    const api = API_MAP[group];
    const apiController = new API_CONTROLLER_MAP[group](api);
    const crawlerClass = CRAWL_MAP[group];
    const downloader = new Downloader();
    const crawler = new crawlerClass(apiController, mongodbStore, downloader);

    if (args.show) {
        await crawler.getMemberList();
        return;
    }

    if (args.members?.length !== 0 && args.group) {
        const memberIds = args.members;
        await crawler.execute(memberIds);
        return;
    }
}

main().catch(console.error).finally(() => process.exit(0));
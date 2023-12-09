"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const MongoDatabase_1 = __importDefault(require("./database/MongoDatabase"));
const Crawler_1 = __importDefault(require("./Crawler"));
const NotEqualMeCrawler_1 = __importDefault(require("./NotEqualMeCrawler"));
const NotEqualMeApIController_1 = __importDefault(require("./ApiCrontroller/NotEqualMeApIController"));
const Downloader_1 = __importDefault(require("./Downloader"));
const dotenv = __importStar(require("dotenv"));
const SakuraApi_1 = require("./api/SakuraApi");
const HinataApi_1 = require("./api/HinataApi");
const SakamichiApiController_1 = __importDefault(require("./ApiCrontroller/SakamichiApiController"));
const NogiApi_1 = require("./api/NogiApi");
const envPath = `${process.cwd()}/.env`;
dotenv.config({ path: envPath });
const COMMANDS = {
    group: {
        alias: "g",
        describe: "chose group sakura / nogi / hinata ex: -g sakura",
        string: true,
    },
    members: {
        alias: "m",
        describe: "input member id ex: -m 21, if you want to download  multiple members please input ex: -m 21 11",
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
const args = yargs_1.default.options(COMMANDS).help().argv;
const CRAWL_MAP = {
    "notEqualMe": NotEqualMeCrawler_1.default,
    "sakura": Crawler_1.default,
    "nogi": Crawler_1.default,
    "hinata": Crawler_1.default
};
const API_CONTROLLER_MAP = {
    // @ts-ignore
    "notEqualMe": NotEqualMeApIController_1.default,
    // @ts-ignore
    "sakura": SakamichiApiController_1.default,
    // @ts-ignore
    "nogi": SakamichiApiController_1.default,
    // @ts-ignore
    "hinata": SakamichiApiController_1.default
};
const API_MAP = {
    sakura: SakuraApi_1.SakuraApi,
    nogi: NogiApi_1.NogiApi,
    hinata: HinataApi_1.HinataApi
};
const DB_HOST = process.env.DB_HOST || 'localhost';
async function main() {
    const mongodbStore = new MongoDatabase_1.default(`mongodb://${DB_HOST}:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000`, "SakaBlog");
    const group = args.group || args.show;
    if (group === undefined) {
        throw new Error("Please input group name");
    }
    const api = API_MAP[group];
    const apiController = new API_CONTROLLER_MAP[group](api);
    const crawlerClass = CRAWL_MAP[group];
    const downloader = new Downloader_1.default();
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
//# sourceMappingURL=app.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const command_1 = require("./command/command");
const Invoker_1 = require("./invoker/Invoker");
const MongodbStoreCrawler_1 = require("./receiver/MongodbStoreCrawler");
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
    showSakuraMember: {
        alias: "s",
        describe: "show sakurazaka member id",
        boolean: true,
    },
    showNogiMember: {
        alias: "n",
        describe: "show nogizaka member id",
        boolean: true,
    },
    showHinataMember: {
        alias: "h",
        describe: "show hinatazaka member id",
        boolean: true,
    },
    date: {
        alias: "d",
        describe: "input spec date,format should be 'YYYYMM' ex: -d 202205",
        string: true,
    },
};
const ERROR_MESSAGE = {
    inputAllNumber: "Please input series number",
    wrongGroupName: "Please input correct group name",
    wrongParameter: "Please input correct parameter",
};
const args = yargs_1.default.options(COMMANDS).help().argv;
async function main() {
    try {
        const receiver = new MongodbStoreCrawler_1.MongodbStoreCrawler("mongodb://0.0.0.0:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000", "SakaBlog");
        const invoker = new Invoker_1.Invoker();
        let group;
        let command;
        //-------------get  member list-------------------
        if (args.showNogiMember || args.showSakuraMember || args.showHinataMember) {
            if (args.showNogiMember) {
                group = "nogi";
            }
            else if (args.showSakuraMember) {
                group = "sakura";
            }
            else if (args.showHinataMember) {
                group = "hinata";
            }
            if (!group) {
                throw new Error(ERROR_MESSAGE.wrongGroupName);
            }
            command = new command_1.CommandGetMemberList(receiver, group);
        }
        //------------XXX: get back blog images--------------------
        else if (args.group && args.members.length > 0 && args.date) {
            group = args.group;
            const { members, date } = args;
            command = new command_1.CommandGetBackBlogImages(receiver, group, members, date);
        }
        //------------get members blogs-------------------
        else if (args.group && args.members.length > 0) {
            group = args.group;
            const { members } = args;
            command = new command_1.CommandDownloadMultiMembersBlog(receiver, group, members);
        }
        else {
            throw new Error(ERROR_MESSAGE.wrongParameter);
        }
        invoker.setCommand(command);
        return await invoker.execute();
    }
    catch (error) {
        console.error(error);
        throw new Error(JSON.stringify(error));
    }
}
main().then(() => {
    console.log("DONE");
    process.exit();
});
//# sourceMappingURL=app.js.map
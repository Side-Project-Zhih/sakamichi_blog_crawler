"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const mongodb_1 = require("mongodb");
const SakuraFactory_1 = require("./groupFactory/SakuraFactory");
const { downloadImage } = require("./util/download");
;
const COMMANDS = {
    group: {
        alias: "g",
        describe: "chose group  sakura / nogi",
        string: true,
    },
    members: {
        alias: "m",
        describe: "input member id",
        array: true,
    },
    showSakuraMember: {
        alias: "s",
        describe: "show sakurazaka member",
        boolean: true,
    },
};
const args = yargs_1.default.options(COMMANDS).help().argv;
async function main() {
    const { db } = await init();
    const groupName = args.group;
    let factory;
    switch (groupName) {
        case "sakura": {
            factory = new SakuraFactory_1.SakuraFactory();
        }
        default: {
            factory;
        }
    }
    if (factory === undefined) {
        throw new Error();
    }
    const group = factory.newInstance();
    const members = args.members;
    // query member
    const memberList = await db.collection("Member").find().toArray();
    const count = 1000;
    const now = "";
    for (const memberId of members) {
        const member = memberList.find((item) => item._id.toString() === memberId);
        const fromDate = member ? member.date : "";
        const timeStatus = member ? "old" : "new";
        const blogs = await group.getBlogs(memberId, {
            count,
            timeStatus,
            fromDate,
        });
        //store content in db
        const blogsContentList = blogs.map((blog) => ({
            insertOne: {
                document: {
                    memberId,
                    content: blog.content,
                    title: blog.title,
                    date: blog.date,
                },
            },
        }));
        await db.collection("Blog").bulkWrite(blogsContentList);
        //downloadImages
        const blogRunList = blogs.map(async (blog) => {
            const images = blog.images;
            const imageRunList = images.map(async (image) => downloadImage(image));
            return Promise.allSettled(imageRunList);
        });
        await Promise.allSettled(blogRunList);
        //udpate member last updated
        await db.collection("Member").updateOne({
            _id: memberId,
        }, {
            $set: {
                date: now,
            },
        });
        console.log(`finish ${member.name} download`);
    }
}
async function init() {
    await (0, mkdirp_1.default)(`${process.cwd()}/public`);
    const client = new mongodb_1.MongoClient("");
    await client.connect();
    const db = client.db("");
    return { db };
}

import yargs from "yargs";
import mkdirp from "mkdirp";
// import mongodb, { MongoClient, Db, ObjectId } from "mongodb";
import { SakuraFactory } from "./groupFactory/SakuraFactory";
import { Mongodb, MongoMember } from "./util/database";
const { downloadImage } = require("./util/download");

type member = MongoMember;

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

const args = yargs.options(COMMANDS).help().argv as {
  group: string;
  members: Array<string>;
  showSakuraMember: boolean;
};

async function main() {
  const { db } = await init();

  const groupName = args.group;
  let factory: SakuraFactory | undefined;
  switch (groupName) {
    case "sakura": {
      factory = new SakuraFactory();
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
  const memberList = await db.getMemberList(members);
  const count = 1000;
  const now: string = "";

  for (const memberId of members) {
    const member = memberList.find(
      (item) => item._id.toString() === memberId
    ) as member;

    const fromDate: string = member ? member.date : "";
    const timeStatus: string = member ? "old" : "new";

    const blogs = await group.getBlogs(memberId, {
      count,
      timeStatus,
      fromDate,
    });
    //store content in db
    await db.bulkInsertBlog(memberId, blogs);

    //downloadImages
    const blogRunList = blogs.map(async (blog) => {
      const images = blog.images;
      const imageRunList = images.map(async (image) => downloadImage(image));
      return Promise.allSettled(imageRunList);
    });

    await Promise.allSettled(blogRunList);

    //udpate member last updated
    await db.updateMember(memberId, {
      date: now,
    });

    console.log(`finish ${member.name} download`);
  }
}

async function init() {
  await mkdirp(`${process.cwd()}/public`);
  const db = new Mongodb(
    "mongodb://localhost:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000",
    "SakaBlog"
  );
  await db.connectClient();
  return { db };
}

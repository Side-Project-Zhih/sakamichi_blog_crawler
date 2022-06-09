import yargs, { string } from "yargs";
import mkdirp from "mkdirp";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

// import mongodb, { MongoClient, Db, ObjectId } from "mongodb";
import { SakuraFactory } from "./groupFactory/SakuraFactory";
import { NogiFactory } from "./groupFactory/NogiFactory";
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
    string: true,
  },
  showSakuraMember: {
    alias: "s",
    describe: "show sakurazaka member",
    boolean: true,
  },
};

const ERROR_MESSAGE = {
  inputAllNumber: "Please input series number",
  wrongGroupName: "Please input correct group name",
};

const args = yargs.options(COMMANDS).help().argv as {
  group: string;
  members: Array<string>;
  showSakuraMember: boolean;
};
dayjs.extend(utc);

async function init() {
  await mkdirp(`${process.cwd()}/public`);
  const db = new Mongodb(
    "mongodb://localhost:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000",
    "SakaBlog"
  );
  await db.connectClient();

  return { db };
}

async function main() {
  try {
    const { db } = await init();
    
    const groupName = args.group;
    await db.updateInitMemberList(groupName);
    
    let factory: SakuraFactory | NogiFactory | undefined;
    switch (groupName) {
      case "sakura": {
        factory = new SakuraFactory();
      }
      case "nogi": {
        factory = new NogiFactory();
      }
      default: {
        factory;
      }
    }

    if (factory === undefined) {
      throw new Error(ERROR_MESSAGE.wrongGroupName);
    }
    const group = factory.newInstance();
    const members = args.members;
    for (const member of members) {
      if (!+member) {
        throw new Error(ERROR_MESSAGE.inputAllNumber);
      }
    }
    // query member
    const memberList = await db.getMemberList(members, groupName);
    let count = "1000";
    const now: string = dayjs
      .utc(new Date())
      .utcOffset(9)
      .format("YYYYMMDDHHmmss");

    for (const memberId of members) {
      const member = memberList.find(
        (item) => item.memberId === memberId
      ) as member;

      console.log(`${member.name}'s blogs start download `);

      const eventName: string = `finish ${member.name} download`;
      const isFirstTime = member.date === undefined;
      let fromDate = member.date;
      let timeStatus: string = "new";

      /** time count start */
      console.time(eventName);
      /** ----------------- */

      if (isFirstTime) {
        await mkdirp(`${process.cwd()}/public/${groupName}/${member.name}`);
        fromDate = now;
        timeStatus = "old";
        count = await group.getBlogsTotalCount(memberId, now);
      }

      fromDate = fromDate as string;

      const blogs = await group.getBlogs(memberId, {
        count,
        timeStatus,
        fromDate,
      });

      if (blogs.length === 0) {
        console.log(`${member.name}'s blogs have already updated to latest `);
        continue;
      }
      console.log(`Blog counts: ${blogs.length}`);

      //store content in db
      await db.bulkInsertBlog(memberId, groupName, blogs);

      //downloadImages
      const blogRunList = blogs.map(async (blog) => {
        const images = blog.images;
        const imageRunList = images.map(
          async (image) => await downloadImage(image)
        );
        return await Promise.allSettled(imageRunList);
      });

      const test = await Promise.allSettled(blogRunList);

      //udpate member last updated
      await db.updateMember(memberId, groupName, {
        date: now,
      });

      /** time count end */
      console.timeEnd(eventName);
      /** ----------------- */
    }
    process.exit();
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
}

main().then(() => console.log("DONE"));
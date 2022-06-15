import dayjs from "dayjs";
import mkdirp from "mkdirp";
import utc from "dayjs/plugin/utc";

import { image, blog } from "../groupFactory/IGroupFactory";
import { SakuraFactory } from "../groupFactory/SakuraFactory";
import { NogiFactory } from "../groupFactory/NogiFactory";
import { HinataFactory } from "../groupFactory/HinataFactory";

const { downloadImage } = require("../util/download");

dayjs.extend(utc);

const ERROR_MESSAGE = {
  inputAllNumber: "Please input series number",
  wrongGroupName: "Please input correct group name",
};

type member = {
  memberId: string;
  group: string;
  name: string;
  date: string | undefined;
};

abstract class DbStoreTemplate {
  async downloadMultiMembersBlog(
    groupName: string,
    members: Array<string>
  ): Promise<void> {
    await this.dbInit();
    await mkdirp(`${process.cwd()}/public`);
    await this.dbUpdateInitMemberList(groupName);

    let factory: SakuraFactory | NogiFactory | HinataFactory | undefined;
    switch (groupName) {
      case "sakura": {
        factory = new SakuraFactory();
        break;
      }
      case "nogi": {
        factory = new NogiFactory();
        break;
      }
      case "hinata": {
        factory = new HinataFactory();
        break;
      }
      default: {
        factory;
      }
    }

    if (factory === undefined) {
      throw new Error(ERROR_MESSAGE.wrongGroupName);
    }

    const group = factory.newInstance();
    for (const member of members) {
      if (typeof +member !== "number") {
        throw new Error(ERROR_MESSAGE.inputAllNumber);
      }
    }
    // query member
    const memberList = (await this.dbQuerytMembers(
      members,
      groupName
    )) as Array<member>;
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
      await mkdirp(`${process.cwd()}/public/${groupName}/${member.name}`);

      if (isFirstTime) {
        fromDate = now;
        timeStatus = "old";
        count = await group.getBlogsTotalCount(memberId, now);
      }

      fromDate = fromDate as string;

      const { blogs, total } = await group.getBlogs(memberId, {
        count,
        timeStatus,
        fromDate,
      });

      if (total === 0) {
        console.log(`${member.name}'s blogs have already updated to latest `);
        continue;
      }

      console.log(`Blog counts: ${total}`);

      //store content in db
      await this.dbBulkUpsertBlog(memberId, groupName, blogs);

      //downloadImages
      for (const blog of blogs) {
        const images = blog.images;
        const imageRunList = images.map(
          async (image) => await downloadImage(image)
        );
        await Promise.allSettled(imageRunList);
      }

      //udpate member last updated
      await this.dbUpdateMember(memberId, groupName, {
        date: now,
      });

      /** time count end */
      console.timeEnd(eventName);
      /** ----------------- */
    }
  }

  async getMemberList(group: string): Promise<void> {
    await mkdirp(`${process.cwd()}/public`);
    await this.dbInit();

    await this.dbUpdateInitMemberList(group);

    const list = await this.dbGetMemberList(group);

    return console.log(list);
  }

  async getBackImages(
    groupName: string,
    members: Array<string>,
    date?: string
  ): Promise<void> {
    await mkdirp(`${process.cwd()}/public`);
    await this.dbInit();

    const blogs = await this.dbGetMembersBlogs(groupName, members, date);
    for (const blog of blogs) {
      const images = blog.images;
      const imageRunList = images.map(
        async (image: image) => await downloadImage(image)
      );
      await Promise.allSettled(imageRunList);
    }
  }

  protected abstract dbInit(): Promise<void>;
  protected abstract dbQuerytMembers(
    members: Array<string>,
    groupName: string
  ): Promise<Array<object>>;
  protected abstract dbBulkUpsertBlog(
    memberId: string,
    groupName: string,
    dataList: Array<object>
  ): Promise<void>;
  protected abstract dbUpdateMember(
    memberId: string,
    groupName: string,
    data: object
  ): Promise<void>;
  protected abstract dbUpdateInitMemberList(group: string): Promise<void>;
  protected abstract dbGetMemberList(group: string): Promise<Array<object>>;
  protected abstract dbGetMembersBlogs(
    groupName: string,
    members: Array<string>,
    date?: string
  ): Promise<Array<blog>>;
}



export { DbStoreTemplate }; 
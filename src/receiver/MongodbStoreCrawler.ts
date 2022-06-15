import { DbStoreTemplate } from "./DbStoreTemplate";
import mongodb, { MongoClient, Db, ObjectId } from "mongodb";
import axios, { AxiosResponse } from "axios";
import { blog } from "../groupFactory/IGroupFactory";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const DATE_FORMAT = "YYYYMMDD000000";

type queryCriteria = {
  group: string;
  memberId: {
    $in: Array<string>;
  };
  date?: object;
};

class MongodbStoreCrawler extends DbStoreTemplate {
  constructor(private url: string, private dbName: string) {
    super();
  }
  
  private client = new MongoClient(this.url);
  public db: mongodb.Db | undefined;
  async connectClient() {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.db = db;
  }

  async dbInit() {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.db = db;
  }

  async dbQuerytMembers(members: Array<string>, groupName: string) {
    if (this.db === undefined) {
      throw new Error();
    }
    const data = await this.db
      .collection("Member")
      .find({
        memberId: {
          $in: members,
        },
        group: groupName,
      })
      .toArray();
    return data;
  }

  async dbBulkUpsertBlog(
    memberId: string,
    groupName: string,
    dataList: Array<blog>
  ) {
    if (this.db === undefined) {
      throw new Error();
    }

    const blogsContentList = dataList.map((blog) => ({
      updateOne: {
        filter: { memberId, group: groupName, date: blog.date },
        update: {
          $set: {
            group: groupName,
            memberId,
            content: blog.content,
            title: blog.title,
            date: blog.date,
            images: blog.images,
          },
        },
        upsert: true,
      },
    }));
    try {
      await this.db.collection("Blog").bulkWrite(blogsContentList);
    } catch (error) {
      console.log(error);
    }
  }

  async dbUpdateMember(
    memberId: string,
    groupName: string,
    data: { date: string }
  ) {
    if (this.db === undefined) {
      throw new Error();
    }

    const now = data.date;
    try {
      await this.db.collection("Member").updateOne(
        {
          memberId,
          group: groupName,
        },
        {
          $set: {
            date: now,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
  async dbUpdateInitMemberList(group: string) {
    if (typeof group !== "string" || this.db === undefined) {
      throw new Error();
    }
    let api: string | undefined;
    switch (group) {
      case "sakura": {
        api = "https://sakurazaka46.com/s/s46app/api/json/diary?cd=blog&mode=C";
        break;
      }
      case "nogi": {
        api =
          "https://www.nogizaka46.com/s/n46/api/json/diary?cd=MEMBER&mode=C";
        break;
      }
      case "hinata": {
        api =
          "https://www.hinatazaka46.com/s/h46app/api/json/diary?cd=member&mode=C";
        break;
      }
    }
    api = api as string;

    const res: AxiosResponse = await axios.get(api);
    const data = res.data.blog as Array<{
      [prop: string]: string;
    }>;

    const list = data.map((member) => {
      const { member_id, creator } = member;
      return {
        updateOne: {
          filter: {
            memberId: member_id,
            group,
          },
          update: {
            $set: {
              memberId: member_id,
              group,
              name: creator,
            },
          },
          upsert: true,
        },
      };
    });

    await this.db.collection("Member").bulkWrite(list);
  }

  async dbGetMemberList(group: string) {
    if (this.db === undefined) {
      throw new Error();
    }

    const data = await this.db
      .collection("Member")
      .find({
        group,
      })
      .project({
        memberId: 1,
        name: 1,
        _id: 0,
      })
      .sort({ memberId: 1 })
      .toArray();

    return data;
  }

  async dbGetMembersBlogs(
    groupName: string,
    members: Array<string>,
    date?: string
  ) {
    if (this.db === undefined) {
      throw new Error();
    }

    const dateObject = dayjs(`date`, "YYYYMM");
    if (dateObject.isValid() === false) {
      throw new Error();
    }

    let startDate: string | undefined = dateObject.format(DATE_FORMAT);
    let endDate: string | undefined = dateObject.format(DATE_FORMAT);

    const criteria: queryCriteria = {
      group: groupName,
      memberId: {
        $in: members,
      },
    };

    if (date) {
      criteria.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const data = (await this.db
      .collection("Blog")
      .find(criteria)
      .project({
        images: 1,
        _id: 0,
      })
      .toArray()) as Array<blog>;

    return data;
  }
}

export { MongodbStoreCrawler };

import mongodb, { MongoClient, Db, ObjectId } from "mongodb";
import { blog } from "../groupFactory/IGroupFactory";
import axios, { AxiosResponse } from "axios";

type MongoMember = {
  _id: ObjectId;
  memberId: string;
  group: string;
  name: string;
  date: string | undefined;
};

interface Idb {
  connectClient(): Promise<void>;
  querytMembers(
    members: Array<string>,
    groupName: string
  ): Promise<Array<object>>;
  bulkUpsertBlog(
    memberId: string,
    groupName: string,
    dataList: Array<object>
  ): Promise<void>;
  updateMember(
    memberId: string,
    groupName: string,
    data: object
  ): Promise<void>;
  updateInitMemberList(group: string): Promise<void>;
  getMemberList(group: string): Promise<Array<object>>;
}

class Mongodb implements Idb {
  constructor(private url: string, private dbName: string) {}
  private client = new MongoClient(this.url);
  public db: mongodb.Db | undefined;
  async connectClient() {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.db = db;
  }

  async querytMembers(members: Array<string>, groupName: string) {
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

  async bulkUpsertBlog(
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

  async updateMember(
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
  async updateInitMemberList(group: string) {
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

  async getMemberList(group: string) {
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
}

export { Mongodb, MongoMember };

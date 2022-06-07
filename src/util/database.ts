import mongodb, { MongoClient, Db, ObjectId } from "mongodb";
import { blog } from "../groupFactory/IGroupFactory";

type MongoMember = {
  _id: ObjectId;
  memberId: string;
  group: string;
  name: string;
  date: string | undefined;
};

interface Idb {
  connectClient(): Promise<void>;
  getMemberList(
    members: Array<string>,
    groupName: string
  ): Promise<Array<object>>;
  bulkInsertBlog(
    memberId: string,
    groupName: string,
    dataList: Array<object>
  ): Promise<void>;
  updateMember(
    memberId: string,
    groupName: string,
    data: object
  ): Promise<void>;
  createInitMemberList(): Promise<void>;
  checkMemberListExist(): Promise<boolean>;
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

  async getMemberList(members: Array<string>, groupName: string) {
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

  async bulkInsertBlog(
    memberId: string,
    groupName: string,
    dataList: Array<blog>
  ) {
    if (this.db === undefined) {
      throw new Error();
    }

    const blogsContentList = dataList.map((blog) => ({
      insertOne: {
        document: {
          group: groupName,
          memberId,
          content: blog.content,
          title: blog.title,
          date: blog.date,
          images: blog.images
        },
      },
    }));

    await this.db.collection("Blog").bulkWrite(blogsContentList);
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
  }
  async createInitMemberList() {
    const data = [
      {
        name: "上村 莉菜",
        group: "sakura",
        memberId: "03",
      },
      {
        name: "尾関 梨香",
        group: "sakura",
        memberId: "04",
      },
      {
        name: "小池 美波",
        group: "sakura",
        memberId: "06",
      },
      {
        name: "小林 由依",
        group: "sakura",
        memberId: "07",
      },
      {
        name: "齋藤 冬優花",
        group: "sakura",
        memberId: "08",
      },
      {
        name: "菅井 友香",
        group: "sakura",
        memberId: "11",
      },
      {
        name: "土生 瑞穂",
        group: "sakura",
        memberId: "14",
      },
      {
        name: "原田 葵",
        group: "sakura",
        memberId: "15",
      },
      {
        name: "渡邉 理佐",
        group: "sakura",
        memberId: "21",
      },
      {
        name: "井上 梨名",
        group: "sakura",
        memberId: "43",
      },
      {
        name: "遠藤 光莉",
        group: "sakura",
        memberId: "53",
      },
      {
        name: "大園 玲",
        group: "sakura",
        memberId: "54",
      },
      {
        name: "大沼 晶保",
        group: "sakura",
        memberId: "55",
      },
      {
        name: "幸阪 茉里乃",
        group: "sakura",
        memberId: "56",
      },
      {
        name: "関 有美子",
        group: "sakura",
        memberId: "44",
      },
      {
        name: "武元 唯衣",
        group: "sakura",
        memberId: "45",
      },
      {
        name: "田村 保乃",
        group: "sakura",
        memberId: "46",
      },
      {
        name: "藤吉 夏鈴",
        group: "sakura",
        memberId: "47",
      },
      {
        name: "増本 綺良",
        group: "sakura",
        memberId: "57",
      },
      {
        name: "松田 里奈",
        group: "sakura",
        memberId: "48",
      },
      {
        name: "森田 ひかる",
        group: "sakura",
        memberId: "50",
      },
      {
        name: "守屋 麗奈",
        group: "sakura",
        memberId: "58",
      },
      {
        name: "山﨑 天",
        group: "sakura",
        memberId: "51",
      },
    ];
    const list = data.map((member) => ({
      insertOne: {
        document: member,
      },
    }));

    if (this.db === undefined) {
      throw new Error();
    }

    await this.db.collection("Member").bulkWrite(list);
  }

  async checkMemberListExist() {
    if (this.db === undefined) {
      throw new Error();
    }
    const member = await this.db
      .collection("Member")
      .findOne({ group: "sakura" });
    return member !== null;
  }
}

export { Mongodb, MongoMember };

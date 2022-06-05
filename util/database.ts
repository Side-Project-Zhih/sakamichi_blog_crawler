import mongodb, { MongoClient, Db, ObjectId } from "mongodb";
import { blog } from "../groupFactory/IGroupFactory";

type MongoMember = {
  _id: ObjectId;
  name: string;
  date: string;
};

interface Idb {
  connectClient(): Promise<void>;
  getMemberList(members: Array<string>): Promise<Array<object>>;
  bulkInsertBlog(memberId: string, dataList: Array<object>): Promise<void>;
  updateMember(memberId: string, data: object): Promise<void>;
  createMemberList(data: object): Promise<void>;
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

  async getMemberList(members: Array<string>) {
    if (this.db === undefined) {
      throw new Error();
    }
    const data = await this.db
      .collection("Member")
      .find({
        _id: {
          $in: members,
        },
      })
      .toArray();
    return data;
  }

  async bulkInsertBlog(memberId: string, dataList: Array<blog>) {
    if (this.db === undefined) {
      throw new Error();
    }

    const blogsContentList = dataList.map((blog) => ({
      insertOne: {
        document: {
          memberId,
          content: blog.content,
          title: blog.title,
          date: blog.date,
        },
      },
    }));

    await this.db.collection("Blog").bulkWrite(blogsContentList);
  }

  async updateMember(memberId: string, data: { date: string }) {
    if (this.db === undefined) {
      throw new Error();
    }
    
    const now = data.date;
    await this.db.collection("Member").updateOne(
      {
        _id: memberId,
      },
      {
        $set: {
          date: now,
        },
      }
    );
  }
  async createMemberList(data: Array<MongoMember>) {}
}

export { Mongodb, MongoMember };

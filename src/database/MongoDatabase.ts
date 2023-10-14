import Database from "./Database";
import {Db, MongoClient,} from "mongodb";
import {Member} from "../ApiCrontroller/ApiController";
import {Blog} from "../Crawler";

export default class MongoDatabase implements Database {
    private db?: Db;

    constructor(private url: string, private dbName: string) {
    }

    async checkMemberList(group: string): Promise<boolean> {
        await this.lazyLoad();
        if (this.db === undefined) {
            throw new Error();
        }
        const result = await this.db.collection("Member").findOne({
            group
        });
        return !!result;
    }

    async getMembers(group: string, memberIds: string[]): Promise<Member[]> {
        await this.lazyLoad();
        if (this.db === undefined) {
            throw new Error();
        }
        const result = await this.db.collection("Member").find<Member>({
            group,
            memberId: {
                $in: memberIds
            }
        }).toArray();
        return result;
    }

    async insertBlogs(group: string, memberId: string, blogs: Blog[]): Promise<void> {
        await this.lazyLoad();
        if (this.db === undefined) {
            throw new Error();
        }
        const data = blogs.map(blog => ({
            updateOne: {
                filter: {memberId, group, date: blog.date},
                update: {
                    $set: {
                        group,
                        memberId,
                        content: blog.content,
                        title: blog.title,
                        date: blog.date,
                        images: blog.images,
                    }
                },
                upsert: true
            }
        }));
        await this.db.collection("Blog").bulkWrite(data);
    }

    async updateMember(group: string, memberId: string, data: { date: string }): Promise<void> {
        await this.lazyLoad();
        if (this.db === undefined) {
            throw new Error();
        }
        if (data.date === undefined) {
            throw new Error();
        }
        await this.db.collection("Member").updateOne({
            group,
            memberId
        }, {
            $set: {
                date: data.date
            }
        });
    }

    async getMemberList(group: string): Promise<Member[]> {
        await this.lazyLoad();
        if (this.db === undefined) {
            throw new Error();
        }
        const result = await this.db.collection("Member").find<Member>({
            group
        }).toArray();
        return result;
    }

    async upsertMemberList(group: string, members: Member[]): Promise<void> {
        await this.lazyLoad();
        if (this.db === undefined) {
            throw new Error();
        }
        const data = members.map(member => ({
            updateOne: {
                filter: {memberId: member.memberId, group},
                update: {
                    $set: {
                        group,
                        memberId: member.memberId,
                        name: member.name,
                    }
                },
                upsert: true
            }
        }));
        await this.db.collection("Member").bulkWrite(data);
    }

    private async lazyLoad() {
        if (!this.db) {
            const client = new MongoClient(this.url);
            await client.connect();
            const db = client.db(this.dbName);
            this.db = db;
        }
    }


}
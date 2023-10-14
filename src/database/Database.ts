import {Member} from "../ApiCrontroller/ApiController";
import {Blog} from "../Crawler";

export default interface Database {
    checkMemberList(group: string): Promise<boolean>;

    getMembers(group: string, memberIds: string[]): Promise<Member[]>;

    insertBlogs(group: string, memberId: string, blogs: Blog[]): Promise<void>;

    updateMember(group: string, memberId: string, data: { date: string }): Promise<void>;

    getMemberList(group: string): Promise<Member[]>;


    upsertMemberList(group: string, members: Member[]): Promise<void>;
}
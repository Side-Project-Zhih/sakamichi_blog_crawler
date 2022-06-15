import { DbStoreTemplate } from "../receiver/DbStoreTemplate";
interface Command {
  execute(...args: any[]): Promise<void>;
}

class CommandDownloadMultiMembersBlog implements Command {
  constructor(
    private _receiver: DbStoreTemplate,
    private _group: string,
    private _members: Array<string>
  ) {}

  async execute(): Promise<void> {
    await this._receiver.downloadMultiMembersBlog(this._group, this._members);
  }
}

class CommandGetMemberList implements Command {
  constructor(private _receiver: DbStoreTemplate, private _group: string) {}

  async execute(): Promise<void> {
    await this._receiver.getMemberList(this._group);
  }
}

class CommandGetBackBlogImages implements Command {
  constructor(
    private _receiver: DbStoreTemplate,
    private _group: string,
    private _members: Array<string>,
    private _date?: string
  ) {}

  async execute(): Promise<void> {
    await this._receiver.getBackImages(this._group, this._members, this._date);
  }
}

export {
  CommandDownloadMultiMembersBlog,
  CommandGetMemberList,
  CommandGetBackBlogImages,
  Command,
};

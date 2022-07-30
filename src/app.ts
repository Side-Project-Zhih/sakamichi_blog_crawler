import yargs from "yargs";

import {
  CommandDownloadMultiMembersBlog,
  CommandGetMemberList,
  CommandGetBackBlogImages,
  Command,
} from "./command/command";

import { Invoker } from "./invoker/Invoker";
import { MongodbStoreCrawler } from "./receiver/MongodbStoreCrawler";

const COMMANDS = {
  group: {
    alias: "g",
    describe: "chose group sakura / nogi / hinata ex: -g sakura",
    string: true,
  },
  members: {
    alias: "m",
    describe:
      "input member id ex: -m 21, if you want to download  multiple members please input ex: -m 21 11",
    array: true,
    string: true,
  },
  showSakuraMember: {
    alias: "s",
    describe: "show sakurazaka member id",
    boolean: true,
  },
  showNogiMember: {
    alias: "n",
    describe: "show nogizaka member id",
    boolean: true,
  },
  showHinataMember: {
    alias: "h",
    describe: "show hinatazaka member id",
    boolean: true,
  },
  date: {
    alias: "d",
    describe: "input spec date,format should be 'YYYYMM' ex: -d 202205",
    string: true,
  },
};

const ERROR_MESSAGE = {
  inputAllNumber: "Please input series number",
  wrongGroupName: "Please input correct group name",
  wrongParameter: "Please input correct parameter",
};

const args = yargs.options(COMMANDS).help().argv as {
  group: string;
  members: Array<string>;
  showSakuraMember: boolean;
  showNogiMember: boolean;
  showHinataMember: boolean;
  date: string;
};

async function main() {
  try {
    const receiver = new MongodbStoreCrawler(
      "mongodb://localhost:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000",
      "SakaBlog"
    );
    const invoker = new Invoker();

    let group: string | undefined;
    let command: Command | undefined;
    //-------------get  member list-------------------
    if (args.showNogiMember || args.showSakuraMember || args.showHinataMember) {
      if (args.showNogiMember) {
        group = "nogi";
      } else if (args.showSakuraMember) {
        group = "sakura";
      } else if (args.showHinataMember) {
        group = "hinata";
      }

      if (!group) {
        throw new Error(ERROR_MESSAGE.wrongGroupName);
      }

      command = new CommandGetMemberList(receiver, group);
    }
    //------------XXX: get back blog images--------------------
    else if (args.group && args.members.length > 0 && args.date) {
      group = args.group;
      const { members, date } = args;

      command = new CommandGetBackBlogImages(receiver, group, members, date);
    }
    //------------get members blogs-------------------
    else if (args.group && args.members.length > 0) {
      group = args.group;
      const { members } = args;

      command = new CommandDownloadMultiMembersBlog(receiver, group, members);
    } else {
      throw new Error(ERROR_MESSAGE.wrongParameter);
    }

    invoker.setCommand(command);

    return await invoker.execute();
  } catch (error) {
    console.error(error);
    throw new Error(JSON.stringify(error));
  }
}

main().then(() => {
  console.log("DONE");
  process.exit();
});

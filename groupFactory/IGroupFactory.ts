import { Iapi } from "../api/IApi";


type image = {
  filename: string;
  src: string;
  dir: string;
};

type blog = {
  title: string;
  date: string;
  content: string;
  images: image[];
};

interface IgroupFactory {
  api: Iapi;
  getBlogs(
    memberId: string,
    { count, fromDate }: { count: number; fromDate: string; timeStatus: string }
  ): Promise<blog[]>;
  // getMember(memberId: string): member;
  // downloadImages(): void;
  newInstance(groupName: string): IgroupFactory;
}

export { IgroupFactory, blog, image };

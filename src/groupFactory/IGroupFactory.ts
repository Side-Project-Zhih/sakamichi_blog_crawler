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

type blogInfo = {
  total: number;
  blogs: Array<blog>;
};

interface IgroupFactory {
  api: Iapi;
  getBlogs(
    memberId: string,
    { count, fromDate }: { count: string; fromDate: string; timeStatus: string }
  ): Promise<blogInfo>;
  getBlogsTotalCount(memberId: string, fromDate: string): Promise<string>;
  newInstance(groupName: string): IgroupFactory;
}

export { IgroupFactory, blog, image, blogInfo };

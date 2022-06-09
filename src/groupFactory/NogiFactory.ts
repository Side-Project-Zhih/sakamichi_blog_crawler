import { IgroupFactory, blog, image } from "./IGroupFactory";
import { NogiApi } from "../api/NogiApi";

import axios, { Axios, AxiosResponse } from "axios";
import { JSDOM } from "jsdom";

type responseBlog = {
  [prop: string]: string;
};

class NogiFactory implements IgroupFactory {
  private groupName: string = "nogi";
  public api = new NogiApi();
  newInstance(): IgroupFactory {
    return new NogiFactory();
  }

  async getBlogs(
    memberId: string,
    {
      count,
      fromDate,
      timeStatus,
    }: { count: string; fromDate: string; timeStatus: string }
  ): Promise<blog[]> {
    const api = this.api.GET_BLOGS_API(memberId, {
      count,
      fromDate,
      timeStatus,
      mode: "B",
    });
    const res: AxiosResponse = await axios.get(api);
    const data: { blog: responseBlog[] } = res.data;
    const blogs = data.blog;
    const output = [];

    for (const blog of blogs) {
      const { title, content, creator } = blog;
      const dir = `${this.groupName}/${creator}`;
      const date = blog.pubdate.replace(/[/: ]/g, "");

      const document = new JSDOM(content).window.document;
      const picsElem = document.querySelectorAll("img");
      const pics: any[] = [];
      picsElem.forEach((item) => pics.push(item));

      const images: image[] = [];

      for (let i = 0; i < pics.length; i++) {
        const pic = pics[i];
        const filename = `${date}_image_${i}.jpg`;
        const src = pic.src;
        pic.src = `/${dir}/${filename}`;
        images.push({
          filename,
          src,
          dir,
        });
      }

      output.push({
        title,
        date,
        content: document.body.outerHTML,
        images: images,
      });
    }

    return output;
  }
  async getBlogsTotalCount(memberId: string, fromDate: string) {
    const api = this.api.GET_BLOGS_API(memberId, {
      count: "1",
      fromDate,
      timeStatus: "old",
      mode: "C",
    });
    const res: AxiosResponse = await axios.get(api);
    const data: responseBlog = res.data;
    const count: string = data.count;
    return count;
  }
}

export { NogiFactory };

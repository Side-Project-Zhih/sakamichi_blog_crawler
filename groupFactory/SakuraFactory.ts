import { IgroupFactory, blog, image } from "./IGroupFactory";
import { SakuraApi } from "../api/SakuraApi";

import axios, { Axios, AxiosResponse } from "axios";
import { JSDOM } from "jsdom";

type responseBlog = {
  [prop: string]: string;
};

class SakuraFactory implements IgroupFactory {
  public api = new SakuraApi();
  newInstance(): IgroupFactory {
    return new SakuraFactory();
  }

  async getBlogs(
    memberId: string,
    {
      count,
      fromDate,
      timeStatus,
    }: { count: number; fromDate: string; timeStatus: string }
  ): Promise<blog[]> {
    const api = this.api.GET_BLOGS_API(memberId, {
      count,
      fromDate,
      timeStatus,
    });
    const res: AxiosResponse = await axios.get(api);
    const data: { blog: responseBlog[] } = res.data;
    const blogs = data.blog;
    const output = [];

    for (const blog of blogs) {
      const { title, content, creator } = blog;
      const dir = creator;
      const date = blog.pubdate.replace(/[/: ]/g, "");

      const document = new JSDOM(content).window.document;
      const picsElem = document.querySelectorAll("img");
      const pics: any[] = [];
      picsElem.forEach((item) => pics.push(item));

      const images: image[] = [];

      for (let i = 0; i < pics.length; i++) {
        const pic = pics[i];
        const filename = `${dir}/${date}_image_${i}.jpg`;
        const src = pic.src;
        pic.src = filename;
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
}

export { SakuraFactory };

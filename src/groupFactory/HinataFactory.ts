import { IgroupFactory, blog, image, blogInfo } from "./IGroupFactory";
import { HinataApi } from "../api/HinataApi";

import axios, { Axios, AxiosResponse } from "axios";
import { JSDOM } from "jsdom";

type responseBlog = {
  [prop: string]: string;
};

class HinataFactory implements IgroupFactory {
  private groupName: string = "hinata";
  public api = new HinataApi();
  newInstance(): IgroupFactory {
    return new HinataFactory();
  }

  async getBlogs(
    memberId: string,
    {
      count,
      fromDate,
      timeStatus,
    }: { count: string; fromDate: string; timeStatus: string }
  ): Promise<blogInfo> {
    const limit: number = 200;
    const round = Math.ceil(+count / limit);
    const output: blog[] = [];
    let lastBlogDate: string = fromDate;
    let total: number = 0;

    for (let i = 0; i < round; i++) {
      const api = this.api.GET_BLOGS_API(memberId, {
        count: "" + limit,
        fromDate: lastBlogDate,
        timeStatus,
        mode: "B",
      });

      const res: AxiosResponse = await axios.get(api);
      const data: { blog: responseBlog[] } = res.data;
      const blogs = data.blog;

      if (blogs.length === 0) {
        break;
      }

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

      //handle total blogs
      if (i === 0) {
        total = blogs.length;
      } else {
        total += blogs.length - 1;
      }

      //handle last blog date
      let lastBlogDateIndex: number = 0;
      switch (timeStatus) {
        case "old": {
          lastBlogDateIndex = blogs.length - 1;
          break;
        }
        case "new": {
          lastBlogDateIndex = 0;
          break;
        }
      }

      lastBlogDate = blogs[lastBlogDateIndex].pubdate.replace(/[/: ]/g, "");
    }

    return {
      blogs: output,
      total,
    };
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

export { HinataFactory };

import fs from "fs";
const { pipeline } = require("stream/promises");
import axios, { AxiosResponse } from "axios";

type image = {
  filename: string;
  src: string;
  dir: string;
};

export = {
  downloadImage: async function (info: image): Promise<void> {
    const { filename, src, dir } = info;
    const path = `${process.cwd()}/public/${dir}/${filename}`;
    const res = await axios.get(src, { responseType: "stream" });
    return await pipeline(res.data, fs.createWriteStream(path));
  },
};

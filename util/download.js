"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
const { pipeline } = require("stream/promises");
const axios_1 = __importDefault(require("axios"));
module.exports = {
    downloadImage: async function (info) {
        const { filename, src, dir } = info;
        const res = await axios_1.default.get(src, { responseType: "stream" });
        const path = `${process.cwd()}/public/${dir}/${filename}}`;
        await pipeline(res.data, fs_1.default.createWriteStream(path));
    },
};

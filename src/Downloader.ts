import fs from "fs";
import axios from "axios";
import {Image} from "./Crawler";

const {pipeline} = require("stream/promises");


export default class Downloader {
    async downloadImages(images: Image[]) {
        const batchSize = 10;
        const batchCount = Math.ceil(images.length / batchSize);

        for (let i = 0; i < batchCount; i++) {
            let batch = images.slice(i * batchSize, (i + 1) * batchSize);
            while (batch.length > 0) {
                const batchResult = await Promise.allSettled(batch.map(image =>
                    this.downloadImage(image)
                ));
                const failedImages = [] as Image[];
                batchResult.forEach((result, i) => {
                    if (result.status === 'rejected') {
                        failedImages.push(batch[i]);
                        return;
                    }

                });
                console.log(`failedImages: ${failedImages.length}`);
                batch = failedImages;
            }
        }
    }

    private async downloadImage(image: Image): Promise<void> {
        const {filename, src, dir} = image;
        const path = `${process.cwd()}/public/${dir}/${filename}`;
        const res = await axios.get(src, {responseType: "stream", timeout: 3000});
        await pipeline(res.data, fs.createWriteStream(path));
    }

}
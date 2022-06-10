# sakamichi_blog_crawler
快速下載blog資料保存在database  
並有簡易server讓你瀏覽blog  

但目前只支援 櫻坂跟乃木坂 因為我偏心....


## 安裝前置
1. 請先安裝mongoDB 跟 mongDB 的GUI studio 3T
2. 建立local端地連線

##注意事項
1. public 該資料夾不能刪，因為圖片都是從這裡讀
2. 一次只能載一個團體的
3. 建議寫bat檔好方便下載

##使用方式
```
下載blog
tsc: build - tsconfig.json
node dst/app.js -g sakura -m 21

瀏覽blog
node index.js
```

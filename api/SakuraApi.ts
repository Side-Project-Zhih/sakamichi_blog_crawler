import { Iapi } from "./IApi";
class SakuraApi implements Iapi {
  private _blogApi: string = "https://sakurazaka46.com/s/s46app/api/json/diary";
  GET_BLOGS_API(
    memberId: string,
    {
      count,
      fromDate,
      timeStatus,
    }: {
      count: number;
      fromDate: string;
      timeStatus: string;
    }
  ) {
    return `${this._blogApi}?cd=blog&get=B&${memberId}&getnum=${count}&fromdate=${fromDate}&timestatus=${timeStatus}`;
  }
}

export { SakuraApi };

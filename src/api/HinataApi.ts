import { Iapi } from "./IApi";
class HinataApi implements Iapi {
  private _blogApi: string =
    "https://www.hinatazaka46.com/s/h46app/api/json/diary";
  GET_BLOGS_API(
    memberId: string,
    {
      count,
      fromDate,
      timeStatus,
      mode,
    }: {
      count: string;
      fromDate: string;
      timeStatus: string;
      mode: string;
    }
  ) {
    return `${this._blogApi}?cd=member&get=${mode}&member_id=${memberId}&fromdate=${fromDate}&timestatus=${timeStatus}&getnum=${count}`;
  }
}

export { HinataApi };

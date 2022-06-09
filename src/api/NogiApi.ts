import { Iapi } from "./IApi";
class NogiApi implements Iapi {
  private _blogApi: string = "https://www.nogizaka46.com/s/n46/api/json/diary";
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
    return `${this._blogApi}?cd=MEMBER&get=${mode}&member_id=${memberId}&getnum=${count}&fromdate=${fromDate}&timestatus=${timeStatus}`;
  }
}

export { NogiApi };

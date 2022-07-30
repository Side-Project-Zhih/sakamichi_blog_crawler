"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HinataApi = void 0;
class HinataApi {
    constructor() {
        this._blogApi = "https://www.hinatazaka46.com/s/h46app/api/json/diary";
    }
    GET_BLOGS_API(memberId, { count, fromDate, timeStatus, mode, }) {
        return `${this._blogApi}?cd=member&get=${mode}&member_id=${memberId}&fromdate=${fromDate}&timestatus=${timeStatus}&getnum=${count}`;
    }
}
exports.HinataApi = HinataApi;
//# sourceMappingURL=HinataApi.js.map
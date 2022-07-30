"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SakuraApi = void 0;
class SakuraApi {
    constructor() {
        this._blogApi = "https://sakurazaka46.com/s/s46app/api/json/diary";
    }
    GET_BLOGS_API(memberId, { count, fromDate, timeStatus, mode, }) {
        return `${this._blogApi}?cd=blog&get=${mode}&member_id=${memberId}&getnum=${count}&fromdate=${fromDate}&timestatus=${timeStatus}`;
    }
}
exports.SakuraApi = SakuraApi;
//# sourceMappingURL=SakuraApi.js.map
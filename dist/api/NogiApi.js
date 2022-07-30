"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NogiApi = void 0;
class NogiApi {
    constructor() {
        this._blogApi = "https://www.nogizaka46.com/s/n46/api/json/diary";
    }
    GET_BLOGS_API(memberId, { count, fromDate, timeStatus, mode, }) {
        return `${this._blogApi}?cd=MEMBER&get=${mode}&member_id=${memberId}&getnum=${count}&fromdate=${fromDate}&timestatus=${timeStatus}`;
    }
}
exports.NogiApi = NogiApi;
//# sourceMappingURL=NogiApi.js.map
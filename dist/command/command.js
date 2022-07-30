"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandGetBackBlogImages = exports.CommandGetMemberList = exports.CommandDownloadMultiMembersBlog = void 0;
class CommandDownloadMultiMembersBlog {
    constructor(_receiver, _group, _members) {
        this._receiver = _receiver;
        this._group = _group;
        this._members = _members;
    }
    async execute() {
        await this._receiver.downloadMultiMembersBlog(this._group, this._members);
    }
}
exports.CommandDownloadMultiMembersBlog = CommandDownloadMultiMembersBlog;
class CommandGetMemberList {
    constructor(_receiver, _group) {
        this._receiver = _receiver;
        this._group = _group;
    }
    async execute() {
        await this._receiver.getMemberList(this._group);
    }
}
exports.CommandGetMemberList = CommandGetMemberList;
class CommandGetBackBlogImages {
    constructor(_receiver, _group, _members, _date) {
        this._receiver = _receiver;
        this._group = _group;
        this._members = _members;
        this._date = _date;
    }
    async execute() {
        await this._receiver.getBackImages(this._group, this._members, this._date);
    }
}
exports.CommandGetBackBlogImages = CommandGetBackBlogImages;
//# sourceMappingURL=command.js.map
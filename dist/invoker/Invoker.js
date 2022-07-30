"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoker = void 0;
class Invoker {
    setCommand(command) {
        this._command = command;
    }
    async execute(...args) {
        if (this._command) {
            await this._command.execute(...args);
        }
        return "no command ";
    }
}
exports.Invoker = Invoker;
//# sourceMappingURL=Invoker.js.map
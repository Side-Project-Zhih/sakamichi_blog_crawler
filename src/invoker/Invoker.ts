import { Command } from "../command/command";

class Invoker {
  private _command?: Command;

  setCommand(command: Command): void {
    this._command = command;
  }

  async execute(...args: Array<any>) {
    if (this._command) {
      return await this._command.execute(...args);
    }
    return "no command ";
  }
}

export { Invoker };

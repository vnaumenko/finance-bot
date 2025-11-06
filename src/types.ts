import { Context, SessionFlavor } from "grammy";

export type MyContext = Context & SessionFlavor<{ sheetName: string }>;

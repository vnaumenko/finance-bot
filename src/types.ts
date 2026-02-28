import { Context, SessionFlavor } from "grammy";

export type MyContext = Context & SessionFlavor<{ settings: Settings }>;

export type Settings = {
  sheet: string;
  totalBalanceCell: string;
  dayLimitCell: string;
  rangeFullBalanceCell: string;
};

import fs from "fs";
import os from "os";
import path from "path";


export type Config = {
  dbUrl: string;
  currentUserName?: string;
};


function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {

  const data = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName ?? null,
  };
  fs.writeFileSync(getConfigFilePath(), JSON.stringify(data, null, 2), "utf-8");
}


function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    throw new Error("Invalid config: not an object");
  }
  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid config: db_url missing or not a string");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name ?? undefined,
  };
}


export function readConfig(): Config {
  const filePath = getConfigFilePath();
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return validateConfig(parsed);
}


export function setUser(userName: string): void {
  const cfg = readConfig();
  cfg.currentUserName = userName;
  writeConfig(cfg);
}
export function getCurrentUser() {
  const config = readConfig();
  return config.currentUserName;
}

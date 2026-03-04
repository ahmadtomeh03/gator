import { readConfig } from "./config.js";
import { setUser } from "./config.js";
import { createUser, getUserByName } from "./lib/db/queries/users";
import { resetUsers } from "./lib/db/queries/users.js";
import { fetchFeed } from "./lib/rss.js";
import { createFeed } from "./lib/db/queries/feeds";
import { getUserByName } from "./lib/db/queries/users";
import { getCurrentUser } from "./config.js";
import { createFeedFollow } from ".lib/db/queries/feed_follows.js";
import { getAllFeeds, FeedWithUser } from "./lib/db/queries/feeds";
import { printFeed } from "./lib/db/queries/feeds";
import { createFeedFollow } from "./lib/db/queries/feed_follows.js";
import { feeds } from "./schema";
import { eq } from "drizzle-orm";
import { getFeedFollowsForUser } from "./lib/db/queries/feed_follows.js";
import {db} from "./lib/db";

export async function handlerAddFeed(cmdName: string, ...args: string[]) {
  if (args.length !== 2) {
    throw new Error(`usage: ${cmdName} <feed_name> <url>`);
  }

  const config = readConfig();
  const user = await getUser(config.currentUserName);

  if (!user) {
    throw new Error(`User ${config.currentUserName} not found`);
  }

  const feedName = args[0];
  const url = args[1];

  const feed = await createFeed(feedName, url, user.id);
  if (!feed) {
    throw new Error(`Failed to create feed`);
  }

  const feedFollow = await createFeedFollow(user.id, feed.id);

  printFeedFollow(user.name, feedFollow.feedName);

  console.log("Feed created successfully:");
  printFeed(feed, user);
}


export async function handlerFollow(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error(`usage: ${cmdName} <feed_url>`);
  }

  const config = readConfig();
  const user = await getUser(config.currentUserName);

  if (!user) {
    throw new Error(`User ${config.currentUserName} not found`);
  }

  const feedURL = args[0];
  const feed = await getFeedByURL(feedURL);
  if (!feed) {
    throw new Error(`Feed not found: ${feedURL}`);
  }

  const ffRow = await createFeedFollow(user.id, feed.id);

  console.log(`Feed follow created:`);
  printFeedFollow(ffRow.userName, ffRow.feedName);
}

export async function handlerListFeedFollows(_: string) {
  const config = readConfig();
  const user = await getUser(config.currentUserName);

  if (!user) {
    throw new Error(`User ${config.currentUserName} not found`);
  }

  const feedFollows = await getFeedFollowsForUser(user.id);
  if (feedFollows.length === 0) {
    console.log(`No feed follows found for this user.`);
    return;
  }

  console.log(`Feed follows for user %s:`, user.id);
  for (let ff of feedFollows) {
    console.log(`* %s`, ff.feedname);
  }
}

export function printFeedFollow(username: string, feedname: string) {
  console.log(`* User:          ${username}`);
  console.log(`* Feed:          ${feedname}`);
}

export async function handlerFeeds() {
  const feeds: FeedWithUser[] = await getAllFeeds();
  
  if (feeds.length === 0) {
    console.log("No feeds found.");
    return;
  }

  for (const feed of feeds) {
    printFeed(feed);
  }
}



export async function handlerAgg(cmdName: string, ...args: string[]) {
  try {
    const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
    console.log(JSON.stringify(feed, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error("Error fetching feed:", err.message);
    process.exit(1);
  }
}

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;
export async function handlerUsers(cmdName: string, ...args: string[]) {
  try {
    const usersList = await getUsers();
    const config = readConfig();
    const currentUser = config.currentUserName; 

    usersList.forEach(user => {
      const isCurrent = user.name === currentUser ? " (current)" : "";
      console.log(`* ${user.name}${isCurrent}`);
    });

    process.exit(0);
  } catch (err: any) {
    console.error("Error listing users:", err.message);
    process.exit(1);
  }
}
export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
) {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}
export async function handlerReset(cmdName: string, ...args: string[]) {
  try {
    await resetUsers();
    console.log("Database reset successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("Error resetting database:", err.message);
    process.exit(1);
  }
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error(`usage: ${cmdName} <name>`);
  }

  const userName = args[0];
  const existingUser = await getUser(userName);
  if (!existingUser) {
    throw new Error(`User ${userName} not found`);
  }

  setUser(existingUser.name);
  console.log("User switched successfully!");
}

export async function handlerRegister(
  cmdName: string,
  ...args: string[]
) {
  const name = args[0];

  if (!name) {
    throw new Error("Username is required");
  }

  const existing = await getUserByName(name);
  if (existing) {
    throw new Error("User already exists");
  }

  const user = await createUser(name);

  setUser(name);

  console.log("User created successfully!");
  console.log(user);
}


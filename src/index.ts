import {handlerUsers ,
  registerCommand,handlerAgg ,
  runCommand,
  CommandsRegistry,
  handlerLogin,
  handlerRegister,
handlerReset,
handlerAddFeed,
handlerFeeds,
handlerFollow,
handlerFollowing  
} from "./cli";

async function main() {
  const registry: CommandsRegistry = {};
registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
registerCommand(registry, "reset", handlerReset);
registerCommand(registry, "agg", handlerAgg);
registerCommand(registry, "feeds", handlerFeeds);
 registerCommand(registry, "feeds", handlerListFeeds);
  registerCommand(registry, "follow", handlerFollow);
  registerCommand(registry, "following", handlerListFeedFollows);
registerCommand(registry, "addfeed", handlerAddFeed);  
const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Error: Not enough arguments provided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();

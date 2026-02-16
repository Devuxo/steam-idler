import fs from "fs";
import path from "path";
import { log } from "./logger";

const SteamUser = require("steam-user") as unknown as SteamUserStatic;

type EResult = number;

interface OwnedApp {
  appid: number;
  name?: string;
  playtime_forever?: number;
}

interface GetUserOwnedAppsResult {
  app_count?: number;
  apps?: OwnedApp[];
}

interface SteamUserInstance {
  steamID?: unknown;

  logOn(details: { accountName: string; password: string }): void;
  setPersona(state: number): void;
  gamesPlayed(apps: number[] | number): void;

  getUserOwnedApps(
    steamID: unknown,
    options: { includePlayedFreeGames?: boolean; includeFreeSub?: boolean },
    callback: (err: Error | null, result?: GetUserOwnedAppsResult) => void
  ): void;

  on(event: "loggedOn", listener: () => void): this;
  on(
    event: "steamGuard",
    listener: (domain: string | null, callback: (code: string) => void) => void
  ): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(
    event: "disconnected",
    listener: (eresult: EResult, msg?: string) => void
  ): this;
}

interface SteamUserStatic {
  new (): SteamUserInstance;
  EPersonaState: { Online: number };
}

interface Account {
  username: string;
  password: string;
  gameIds: number[];
}

function loadAccounts(): Account[] {
  const filePath = path.resolve(__dirname, "../accounts.json");

  if (!fs.existsSync(filePath)) {
    console.error(`\naccounts.json не найдено в: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  try {
    const accounts: Account[] = JSON.parse(raw);

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error("accounts.json должен быть непустым массивом");
    }

    return accounts;
  } catch (err) {
    console.error(`Не удалось спарсить accounts.json: ${(err as Error).message}`);
    process.exit(1);
  }
}

function minutesToHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

function createClient(account: Account): SteamUserInstance {
  const client = new SteamUser();

  client.logOn({
    accountName: account.username,
    password: account.password,
  });

  client.on("loggedOn", () => {
    log.success(account.username, "сессия установлена");
    log.idle(
      account.username,
      `включение накрутки игрового времени в указанные App IDs: ${account.gameIds.join(", ")}`
    );

    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed(account.gameIds);

    setTimeout(() => fetchHours(client, account), 3000);
  });

  client.on("steamGuard", (_domain, callback) => {
    log.prompt(account.username, "Steam Guard требуется код →");
    process.stdin.once("data", (data) =>
      callback(data.toString().trim())
    );
  });

  client.on("error", (err) => {
    log.error(account.username, err.message);
  });

  client.on("disconnected", (_eresult, msg) => {
    log.disconnect(account.username, msg ?? "связь потеряна");

    setTimeout(() => {
      client.logOn({
        accountName: account.username,
        password: account.password,
      });
    }, 30_000);
  });

  return client;
}

function fetchHours(client: SteamUserInstance, account: Account): void {
  if (!client.steamID) return;

  client.getUserOwnedApps(
    client.steamID,
    { includePlayedFreeGames: true, includeFreeSub: true },
    (_err, result) => {
      const apps = result?.apps ?? [];

      if (!apps.length) {
        log.warn(
          account.username,
          "не удалось загрузить игры, принадлежащие вам - профиль может быть приватным"
        );
        return;
      }

      log.tableHeader(account.username);

      for (const appId of account.gameIds) {
        const game = apps.find((g) => g.appid === appId);

        if (game) {
          log.hours(
            account.username,
            game.name ?? `App ${appId}`,
            minutesToHours(game.playtime_forever ?? 0)
          );
        } else {
          log.hours(account.username, `App ID ${appId}`, "0.0");
        }
      }

      log.tableFooter();
      log.idle(account.username, "процесс запущен  //  Ctrl+C для завершения");
    }
  );
}

function scheduleRefresh(
  clients: { client: SteamUserInstance; account: Account }[]
): void {
  setInterval(() => {
    log.separator();
    log.boot(`плановое обновление @ ${new Date().toLocaleTimeString("en-GB")}`);

    clients.forEach(({ client, account }) =>
      fetchHours(client, account)
    );
  }, 30 * 60 * 1000);
}

async function boot(): Promise<void> {
  log.banner();

  const accounts = loadAccounts();

  log.boot(`загружено ${accounts.length} аккаунт(ов)`);
  log.boot("Инициализация подключений Steam...");
  log.separator();

  const clients: { client: SteamUserInstance; account: Account }[] = [];

  for (const account of accounts) {
    log.info(
      account.username,
      `соединение  //  указанные игры: [${account.gameIds.join(", ")}]`
    );

    const client = createClient(account);
    clients.push({ client, account });
  }

  scheduleRefresh(clients);
}

boot();
// ─── ANSI Color Codes ────────────────────────────────────────────────────────

const C = {
  reset:    "\x1b[0m",
  bold:     "\x1b[1m",
  dim:      "\x1b[2m",
  green:    "\x1b[32m",
  cyan:     "\x1b[36m",
  yellow:   "\x1b[33m",
  red:      "\x1b[31m",
  magenta:  "\x1b[35m",
  white:    "\x1b[37m",
  bgGreen:  "\x1b[42m",
  bgRed:    "\x1b[41m",
  gray:     "\x1b[90m",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timestamp(): string {
  return `${C.gray}[${new Date().toLocaleTimeString("en-GB")}]${C.reset}`;
}

function tag(username: string): string {
  return `${C.cyan}${C.bold}[${username.toUpperCase()}]${C.reset}`;
}

// ─── Logger ──────────────────────────────────────────────────────────────────

export const log = {
  banner(): void {
    const lines = [
      "",
      "________  _______________   ________ _______  ___________   ",
      "\\______ \\ \\_   _____/\\   \\ /   /    |   \\   \\/  /\\_____  \\  ",
      " |    |  \\ |    __)_  \\   Y   /|    |   /\\     /  /   |   \\ ",
      " |    `   \\|        \\  \\     / |    |  / /     \\ /    |    \\",
      "/_______  /_______  /   \\___/  |______/ /___/\\  \\_______  /",
      "        \\/        \\/                          \\_/        \\/ ",
      "",
    ];
 
    const rainbowColors = [
      C.red,
      C.yellow,
      C.green,
      C.cyan,
      C.magenta, 
    ];
 
    const rainbow = (line: string): string => {
      let result = '';
      for (let i = 0; i < line.length; i++) {
        const color = rainbowColors[i % rainbowColors.length];
        result += color + line[i] + C.reset;
      }
      return result;
    };

    lines.forEach((l) => console.log(rainbow(l)));
  },

  boot(msg: string): void {
    console.log(`${timestamp()} ${C.green}>${C.reset} ${C.white}${msg}${C.reset}`);
  },

  info(user: string, msg: string): void {
    console.log(`${timestamp()} ${tag(user)} ${C.cyan}::${C.reset} ${msg}`);
  },

  success(user: string, msg: string): void {
    console.log(`${timestamp()} ${tag(user)} ${C.green}${C.bold}[ДОСТУП РАЗРЕШЕН]${C.reset} ${C.green}${msg}${C.reset}`);
  },

  idle(user: string, msg: string): void {
    console.log(`${timestamp()} ${tag(user)} ${C.magenta}[ПРОСТОЙ]${C.reset} ${msg}`);
  },

  hours(user: string, name: string, hours: string): void {
    console.log(
      `  ${C.gray}│${C.reset}  ${C.white}${name.padEnd(28)}${C.reset}` +
      `${C.yellow}${C.bold}${hours.padStart(7)} часов${C.reset}`
    );
  },

  tableHeader(user: string): void {
    console.log(`\n${timestamp()} ${tag(user)} ${C.cyan}[СТАТЫ]${C.reset} ${C.white}Текущий снимок игрового времени:${C.reset}`);
    console.log(`  ${C.gray}┌${"─".repeat(62)}┐${C.reset}`);
    console.log(`  ${C.gray}│${C.reset}  ${"ИГРА".padEnd(28)}${C.cyan}   ЧАСОВ${C.reset}  ${C.gray}`);
    console.log(`  ${C.gray}├${"─".repeat(62)}┤${C.reset}`);
  },

  tableFooter(): void {
    console.log(`  ${C.gray}└${"─".repeat(62)}┘${C.reset}\n`);
  },

  warn(user: string, msg: string): void {
    console.log(`${timestamp()} ${tag(user)} ${C.yellow}[ПРЕДУПРЕЖДЕНИЕ]${C.reset} ${C.yellow}${msg}${C.reset}`);
  },

  error(user: string, msg: string): void {
    console.log(`${timestamp()} ${tag(user)} ${C.red}${C.bold}[ОШИБКА]${C.reset} ${C.red}${msg}${C.reset}`);
  },

  prompt(user: string, msg: string): void {
    process.stdout.write(`${timestamp()} ${tag(user)} ${C.yellow}[ВВОД]${C.reset} ${C.yellow}${msg}${C.reset} `);
  },

  disconnect(user: string, msg: string): void {
    console.log(`${timestamp()} ${tag(user)} ${C.red}[ОТКЛЮЧЕНИЕ]${C.reset} ${msg} ${C.gray}// повторная попытка через 30 секунд${C.reset}`);
  },

  separator(): void {
    console.log(`${C.gray}  ${"─".repeat(62)}${C.reset}`);
  },
};
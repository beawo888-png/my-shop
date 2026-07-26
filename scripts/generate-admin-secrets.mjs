import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

async function readPassword() {
  if (!process.stdin.isTTY) {
    let value = "";
    for await (const chunk of process.stdin) value += chunk;
    return value.replace(/[\r\n]+$/, "");
  }

  process.stdout.write("관리자 비밀번호를 입력하세요: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return await new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };
    const onData = (character) => {
      if (character === "\u0003") {
        cleanup();
        reject(new Error("cancelled"));
      } else if (character === "\r" || character === "\n") {
        cleanup();
        resolve(value);
      } else if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

try {
  const password = await readPassword();
  if (password.length < 12) throw new Error("비밀번호는 12자 이상이어야 합니다.");
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 32, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const encoded = [
    "scrypt",
    16_384,
    8,
    1,
    salt.toString("base64url"),
    Buffer.from(derived).toString("base64url"),
  ].join("$");

  console.log(`ADMIN_PASSWORD_HASH=${encoded}`);
  console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
  console.log(`ADMIN_IP_HASH_SECRET=${randomBytes(32).toString("base64url")}`);
  console.log("위 값을 비밀 환경변수에 등록하고 파일에 저장하지 마세요.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "비밀값 생성에 실패했습니다.");
  process.exitCode = 1;
}

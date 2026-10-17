import { spawn } from "node:child_process";

/** 사장님 PC 화면에 알림 창을 띄운다(윈도우). 콘솔에도 남긴다. */
export function alertOwner(message, title = "스마트플레이스 자동 작업") {
  console.error(`\n❌ ${message}`);
  if (process.platform !== "win32") return;
  const safe = message.replace(/'/g, "''");
  const child = spawn(
    "powershell",
    ["-NoProfile", "-Command", `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${safe}', '${title}')`],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
}

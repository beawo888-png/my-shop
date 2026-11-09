#!/usr/bin/env node
/** 카카오톡 알림이 잘 가는지 시험 메시지를 한 통 보낸다. `npm run kakao:test` */

import { sendKakaoMemo } from "../../lib/notify/kakao.mjs";

const sent = await sendKakaoMemo("[왕징 블로그] 시험 메시지예요. 이 메시지가 보이면 알림이 잘 연결된 거예요.");
console.log(sent ? "✅ 보냈습니다. 카카오톡 '나와의 채팅'을 확인해 주세요." : "❌ 보내지 못했습니다.");
if (!sent) process.exitCode = 1;

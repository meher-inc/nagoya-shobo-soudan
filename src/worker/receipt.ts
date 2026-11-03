// 専門家への依頼（escalations.ts）の区分名と、依頼者への受付の自動返信の文面
import type { Lane } from "./escalation";
import { SERVICE } from "../config/service.ts";

export const LANE_LABEL: Record<Lane, string> = {
  gyosei: "行政書士（書類の作成・提出）",
  setsubi: "点検・工事の手配",
  bengoshi: "弁護士への相談案内",
};

/** 依頼者への受付の自動返信。約束できないこと（連絡の期限、引き受けの可否、費用）は書かない */
export function receiptMail(lane: Lane, area: string, name: string): { subject: string; text: string } {
  return {
    subject: `【トドケデ AI】ご依頼を受け付けました（${LANE_LABEL[lane]}・${area}）`,
    text: [
      `${name} 様`,
      "",
      "トドケデ AI へのご依頼ありがとうございます。次の内容で受け付けました。",
      "",
      `区分: ${LANE_LABEL[lane]}`,
      `地域: ${area}`,
      "",
      "ご相談の内容を確認し、対応できる専門家が見つかりしだい、担当からご連絡します。地域や内容によっては、お引き受けできない場合や、ご連絡までお時間をいただく場合があります。",
      "契約と報酬は、専門家とご依頼者の間で決めていただきます。トドケデ AI は紹介料をいただいていません。",
      "",
      "期限の迫った届出は、所轄の消防署にも早めにご相談ください。火災などの緊急時は119番に通報してください。",
      "",
      "このメールに返信すると、トドケデ AI の窓口に届きます。お心当たりのない場合は、その旨を返信してください。",
      "",
      `トドケデ AI（運営: ${SERVICE.seller.name}）`,
    ].join("\n"),
  };
}

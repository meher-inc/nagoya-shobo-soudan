// 相談文から物件条件と場面を読み取り、判定結果をモデルに渡す「判定メモ」を作る。
// 読み取りは正規表現だけで行う（LLMに条件を推測させない）。読み取れなかった項目は判定側が「条件次第」にする。

import { EQUIPMENT_LABEL, judge, type Equipment, type Facts, type Verdict } from "./install.ts";
import { judgeFilings, type FilingFacts, type FilingVerdict, type Jurisdiction, type Scene } from "./filings.ts";

// 用途の言い換え → 令別表第一の項。曖昧なもの（診療所・老人ホームなど）は細分を決めずに入れない
const OCCUPANCY_WORDS: [RegExp, string][] = [
  [/劇場|映画館|演芸場/, "1イ"],
  [/公会堂|集会場/, "1ロ"],
  [/キャバレー|ナイトクラブ/, "2イ"],
  [/遊技場|ゲームセンター|ダンスホール/, "2ロ"],
  [/カラオケ|ネットカフェ|インターネットカフェ|漫画喫茶|マンガ喫茶|個室ビデオ/, "2ニ"],
  [/飲食店|レストラン|居酒屋|カフェ|喫茶店|ラーメン店|焼肉店|定食屋|食堂|バー(?!ベキュー)/, "3ロ"],
  [/百貨店|物品販売|物販|小売店|コンビニ|スーパー|ドラッグストア|アパレル|雑貨店/, "4"],
  [/ホテル|旅館|簡易宿所|民泊|ゲストハウス/, "5イ"],
  [/共同住宅|マンション|アパート|寄宿舎|下宿|シェアハウス/, "5ロ"],
  [/保育所|保育園|児童発達支援|放課後等デイサービス/, "6ハ"],
  [/幼稚園|特別支援学校/, "6ニ"],
  [/サウナ風呂|蒸気浴場|熱気浴場/, "9イ"],
  [/銭湯|公衆浴場/, "9ロ"],
  [/小学校|中学校|高等学校|大学|専修学校|各種学校/, "7"],
  [/図書館|博物館|美術館/, "8"],
  [/車両の停車場|駅舎/, "10"],
  [/神社|寺院|教会/, "11"],
  [/工場|作業場/, "12イ"],
  [/スタジオ/, "12ロ"],
  [/駐車場|車庫/, "13イ"],
  [/倉庫/, "14"],
  [/事務所|オフィス|会社|営業所/, "15"],
];

const num = (s: string) => Number(s.replace(/[,，]/g, "").normalize("NFKC"));

export function extractFacts(text: string): FilingFacts {
  const t = text.normalize("NFKC");
  const f: FilingFacts = {};
  const explicit = t.match(/(?<!第\s*)[（(]?(\d{1,2}(?:の[23])?)[)）]?項\s*([イロハニ])?(?:\s*[（(](\d)[)）])?/);
  if (explicit) f.occupancy = `${explicit[1]}${explicit[2] ?? ""}${explicit[3] ? `(${explicit[3]})` : ""}`;
  else {
    const hits = OCCUPANCY_WORDS.filter(([re]) => re.test(t)).map(([, o]) => o);
    const uniq = [...new Set(hits)];
    if (uniq.length === 1) f.occupancy = uniq[0];
    else if (uniq.length > 1) f.occupancy = "16イ"; // 用途が複数 → 複合用途として判定し「条件次第」に倒す
  }
  const area = t.match(/(?:延べ|延床|延べ床|床面積)?\s*(?:面積)?\s*(?:が|は)?\s*([\d,]+(?:\.\d+)?)\s*(?:㎡|m2|m²|平米|平方メートル)/);
  if (area) f.total_area = num(area[1]);
  const tsubo = !area && t.match(/([\d,]+(?:\.\d+)?)\s*坪/);
  if (tsubo) f.total_area = Math.round(num(tsubo[1]) * 3.30578);
  const cap = t.match(/(?:収容人員|定員|従業員|席数|客席)?\s*(?:が|は)?\s*([\d,]+)\s*(?:人|名|席)/);
  if (cap) f.capacity = num(cap[1]);
  if (/平屋/.test(t)) f.floors_above = 1;
  const floors = t.match(/(?:地上)?\s*(\d{1,2})\s*階建/);
  if (floors) f.floors_above = num(floors[1]);
  const below = t.match(/地下\s*(\d)\s*階(?:建|、|・|\s*地上)/);
  if (below) f.floors_below = num(below[1]);
  const kw = t.match(/([\d,]+(?:\.\d+)?)\s*(?:kW|キロワット)(?!h|時)/i);
  if (kw) f.kitchen_kw = num(kw[1]);
  const kwh = t.match(/([\d,]+(?:\.\d+)?)\s*(?:kWh|キロワット時)/i);
  if (kwh) f.battery_kwh = num(kwh[1]);
  if (/下方(に|へ)?排気|立ち下が/.test(t)) f.exhaust_down = true;
  if (/上方(に|へ)?排気/.test(t)) f.exhaust_down = false;
  if (/(コンロ|フライヤー|ガス|火を使|調理|厨房|かまど|グリル)/.test(t)) f.fire_use = true;
  if (/火を使わない|IHのみ|電気調理のみ/.test(t)) f.fire_use = false;
  if (/厨房設備|厨房機器|フライヤー|業務用コンロ/.test(t)) f.facility = "kitchen";
  else if (/サウナ設備|サウナを設置|サウナを置|テントサウナ/.test(t)) f.facility = "sauna";
  else if (/蓄電池/.test(t)) f.facility = "battery";
  else if (/ボイラー/.test(t)) f.facility = "boiler";
  if (/自宅|個人の住居|住宅に/.test(t)) f.residence = true;
  if (/事業所|店舗|施設|会社/.test(t) && f.residence === undefined) f.residence = false;
  if (/建築確認(を|は)?受け(ない|ません|ず)|確認申請(は|を)?(しない|しません|不要|出さない)/.test(t)) f.building_permit = false;
  else if (/建築確認|確認申請/.test(t)) f.building_permit = true;
  if (/露店|屋台|出店/.test(t)) f.stall_fire = /コンロ|火|ガス|炭|鉄板|発電機/.test(t) ? true : undefined;
  if (/展示場|観覧場|イベントホール|展示会場/.test(t)) f.exhibition_hall = true;
  if (/排気ダクト|排気用ダクト|ダクト付き|ダクトがある|フード/.test(t)) f.has_duct = true;
  if (/ダクトなし|ダクトはない|ダクトがない/.test(t)) f.has_duct = false;
  if (/家族だけ|自分たちだけ|個人的(に|な)?(使|利用)|自分で使う|プライベート/.test(t)) f.personal_use = true;
  if (/お客|客に|貸し出|有料|営業/.test(t) && f.personal_use === undefined) f.personal_use = false;
  // 危険物の数量（リットル）→ 指定数量の倍数。指定数量: ガソリン200L、灯油・軽油1,000L、重油2,000L
  const oil = t.match(/(ガソリン|灯油|軽油|重油)[^\d]{0,8}([\d,]+(?:\.\d+)?)\s*(?:L|ℓ|リットル)/i) ?? t.match(/([\d,]+(?:\.\d+)?)\s*(?:L|ℓ|リットル)の?(ガソリン|灯油|軽油|重油)/i);
  if (oil) {
    const [kind, amount] = /\d/.test(oil[1]) ? [oil[2], oil[1]] : [oil[1], oil[2]];
    const unit = { ガソリン: 200, 灯油: 1000, 軽油: 1000, 重油: 2000 }[kind as "ガソリン"]!;
    f.hazmat_ratio = Math.round((num(amount) / unit) * 1000) / 1000;
  }
  if (/[2２二]つの区|複数の区|区をまたが|2以上の区/.test(t)) f.multi_ward = true;
  if (/準耐火建築物/.test(t)) f.building_class = "quasi_fireproof";
  else if (/耐火建築物/.test(t)) f.building_class = "fireproof";
  const height = t.match(/高さ(?:が|は)?\s*([\d.]+)\s*(?:m|メートル)/);
  if (height) f.height = num(height[1]);
  const stairs = t.match(/階段が?\s*(\d|一|二|1つ|2つ|ひとつ|ふたつ)/);
  if (stairs) f.direct_stairs = /^(1|一|1つ|ひとつ)$/.test(stairs[1]) ? 1 : 2;
  return f;
}

export function detectScenes(text: string): Scene[] {
  const t = text.normalize("NFKC");
  const s: Scene[] = [];
  if (/使用開始|開業|開店|オープン|入居|使い始め|営業を始め|テナントに入/.test(t)) s.push("use_start");
  if (/模様替|改装|内装工事|改修|リフォーム|用途変更|間取り|増築/.test(t)) s.push("renovation");
  if (/ポップアップ|一時的|期間限定|短期間/.test(t) && !/展示場|観覧場/.test(t)) s.push("temp_use");
  if (/厨房設備|厨房機器|フライヤー|業務用コンロ|サウナ設備|サウナを設置|サウナを置|蓄電池|ボイラー|火気使用設備|火を使う設備/.test(t)) s.push("fire_equipment");
  if (/少量危険物|指定可燃物|(灯油|ガソリン|軽油|重油)[^\d]{0,8}\d+\s*(L|ℓ|リットル)|\d+\s*(L|ℓ|リットル)の?(灯油|ガソリン|軽油|重油)/i.test(t)) s.push("small_hazmat");
  if (/露店|屋台|出店/.test(t)) s.push("stall");
  if (/催し|催物|イベント|展示会|コンサート/.test(t) && !s.includes("stall")) s.push("event");
  if (/消防訓練|避難訓練|消火訓練|通報訓練/.test(t)) s.push("drill");
  if (/溶接|溶断|ガス切断/.test(t)) s.push("hot_work");
  if (/たき火|焚き火|野焼き|火災と紛らわしい|煙が出る/.test(t)) s.push("bonfire");
  if (/断水|減水/.test(t)) s.push("water_outage");
  return s;
}

const INSTALL_FOR_NOTE: Equipment[] = ["fire_manager", "extinguisher", "indoor_hydrant", "sprinkler", "auto_alarm", "emergency_alarm", "guide_light"];
// 大規模な建物で必要になる設備。必要か条件次第のときだけ判定メモに載せる
const INSTALL_LARGE: Equipment[] = ["fire_report", "outdoor_hydrant", "fire_water", "smoke_control", "standpipe", "emergency_outlet"];

const RESULT_JA = { required: "必要", not_required: "不要", conditional: "条件次第" } as const;

const MISSING_JA: Record<string, string> = {
  occupancy: "用途（何に使う建物か）",
  total_area: "延べ面積",
  capacity: "収容人員（従業員と客の合計）",
  floors_above: "地上の階数",
  floors_below: "地階の有無",
  fire_use: "火を使う設備・器具の有無",
  structure: "建物の構造（耐火構造か、内装の仕上げ）",
  overnight: "入居・宿泊させるか",
  lath_wall: "ラスモルタル造などの壁か",
  direct_stairs: "直通階段の数",
  specific_use_upper: "店舗・飲食店などが2階以上にあるか",
  floor: "どの階か",
  floor_capacity: "その階の収容人員",
  floor_area: "その階の床面積",
  kitchen_kw: "同じ厨房室の厨房設備の入力の合計（kW）",
  exhaust_down: "排気が下向き（排気ダクトが立ち下がる）か",
  small_specific_complex: "小規模特定用途複合防火対象物か",
  battery_kwh: "蓄電池容量（kWh）",
  residence: "個人の住居に設けるか",
  building_permit: "建築確認を受ける工事か",
  stall_fire: "露店で火気を使うか",
  exhibition_hall: "観覧場・展示場で行うか",
  has_duct: "厨房設備に排気用ダクトがあるか",
  building_class: "耐火建築物か準耐火建築物か",
  lower_floors_area: "1階と2階の床面積の合計",
  site_area: "敷地面積",
  height: "建物の高さ",
  personal_use: "個人的な使用か（人に使わせるか）",
  facility: "設ける設備の種類",
};

const line = (label: string, r: Verdict | FilingVerdict, extra = "") =>
  `- ${label}: ${RESULT_JA[r.result]}${"assertive" in r && !r.assertive && r.result === "required" ? "（原則）" : ""}${extra}。理由: ${r.reason}。根拠: ${r.basis}${
    r.missing.length ? `。足りない情報: ${[...new Set(r.missing)].map((m) => MISSING_JA[m] ?? m).join("、")}` : ""
  }`;

export type RulesResult = { facts: FilingFacts; scenes: Scene[]; install: Verdict[]; filings: FilingVerdict[] };

/** 会話中の利用者の発言（古い順）から判定する。後の発言の値を優先する */
export function runRules(jurisdiction: Jurisdiction, userTexts: string[]): RulesResult | null {
  const facts: FilingFacts = {};
  for (const t of userTexts) Object.assign(facts, Object.fromEntries(Object.entries(extractFacts(t)).filter(([, v]) => v !== undefined)));
  const latest = userTexts.at(-1) ?? "";
  const scenes = detectScenes(latest).length ? detectScenes(latest) : detectScenes(userTexts.join("\n"));
  if (!facts.occupancy && !scenes.length) return null;
  const install = facts.occupancy
    ? [...INSTALL_FOR_NOTE.map((e) => judge(e, facts as Facts)), ...INSTALL_LARGE.map((e) => judge(e, facts as Facts)).filter((v) => v.result !== "not_required")]
    : [];
  const filings = scenes.flatMap((s) => judgeFilings(jurisdiction, s, facts));
  return { facts, scenes, install, filings };
}

export function rulesNote(r: RulesResult): string {
  const out = ["# ルールによる判定結果（この回答の結論はこれに従う）"];
  out.push("相談文から読み取った条件で、条文どおりに機械的に判定した結果です。「個別の要否を断定しない」という指示より、この判定結果を優先します。結論（必要／不要／条件次第）と期限・提出先はこのとおりに書き、変えないでください。");
  out.push("「条件次第」の項目は断定せず、足りない情報を最大3つまで質問してください。読み取った条件が相談内容と違う場合は、そのことを伝えて確認してください。");
  const f = r.facts;
  const cond = [
    f.occupancy && `用途 令別表第一${f.occupancy.replace(/^(\d{1,2}(?:の[23])?)(.*)$/, "($1)項$2")}`,
    f.total_area !== undefined && `延べ面積 ${f.total_area}㎡`,
    f.capacity !== undefined && `収容人員 ${f.capacity}人`,
    f.floors_above !== undefined && `地上${f.floors_above}階`,
    f.kitchen_kw !== undefined && `厨房設備の入力 ${f.kitchen_kw}kW`,
  ].filter(Boolean);
  if (cond.length) out.push(`読み取った条件: ${cond.join("、")}`);
  if (r.filings.length) {
    out.push("## 届出");
    for (const x of r.filings)
      out.push(line(x.title, x, x.result !== "not_required" && x.deadline ? `（期限: ${x.deadline}、提出先: ${x.target}${x.form ? `、様式: ${x.form}` : ""}）` : "") + (x.inspection ? `。検査: ${x.inspection}` : "") + (x.caveats.length ? `。注意: ${x.caveats.join(" / ")}` : ""));
    out.push("届出書の作成・提出の代行は行政書士の業務です。記入内容や記入例は書かず、必要なら行政書士への依頼を案内してください。");
  }
  if (r.install.length) {
    out.push("## 消防用設備等・防火管理者（消防法施行令）");
    for (const x of r.install) out.push(line(EQUIPMENT_LABEL[x.equipment], x, x.detail ? `（${x.detail}）` : x.scope ? `（${x.scope}）` : ""));
    out.push("条例による上乗せや、総務省令の除外・令第32条の特例はこの判定に含まれていません。最終的な判断は所轄の消防署が行う旨を添えてください。");
  }
  return out.join("\n");
}

#!/usr/bin/env python3
"""名古屋市版（このリポジトリ）と cities/<slug>/ から、政令指定都市版のリポジトリ一式を組み立てる。

使い方: python3 scripts/gen-city.py <出力先ディレクトリ> <slug> [<slug> ...]
出力:   <出力先>/<slug>-shobo-soudan/（git init はしない）
都市ごとの値（service.ts・stations.ts・prompt.ts・notes.md）は cities/<slug>/。出典と未確認の項目は notes.md。
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("out")

CITIES = {
    "sapporo": ("札幌市", "北海道"),
    "sendai": ("仙台市", "宮城県"),
    "saitama": ("さいたま市", "埼玉県"),
    "chiba": ("千葉市", "千葉県"),
    "yokohama": ("横浜市", "神奈川県"),
    "kawasaki": ("川崎市", "神奈川県"),
    "sagamihara": ("相模原市", "神奈川県"),
    "niigata": ("新潟市", "新潟県"),
    "shizuoka": ("静岡市", "静岡県"),
    "hamamatsu": ("浜松市", "静岡県"),
    "osaka": ("大阪市", "大阪府"),
    "sakai": ("堺市", "大阪府"),
    "kobe": ("神戸市", "兵庫県"),
    "okayama": ("岡山市", "岡山県"),
    "hiroshima": ("広島市", "広島県"),
    "kitakyushu": ("北九州市", "福岡県"),
    "fukuoka": ("福岡市", "福岡県"),
    "kumamoto": ("熊本市", "熊本県"),
}

# 既存のレート制限 namespace（アカウント内で重複させない）
TAKEN = {"4101", "6761"}
IGNORE = {"node_modules", ".git", "CITY_BRIEF.md", "gen-city.py", "dist", "test-results", "playwright-report", ".wrangler", ".dev.vars"}


def namespace_for(service_id: str) -> str:
    h = 7
    for c in service_id:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    n = 5000 + (h % 4000)
    while str(n) in TAKEN:
        n += 1
    TAKEN.add(str(n))
    return str(n)


def sub(path: Path, old: str, new: str, count: int = 0, required: bool = True) -> None:
    s = path.read_text()
    if old not in s:
        if required:
            raise SystemExit(f"{path}: 置き換え元が見つからない: {old[:60]}")
        return
    path.write_text(s.replace(old, new) if count == 0 else s.replace(old, new, count))


def build(slug: str) -> Path:
    ja, pref = CITIES[slug]
    sid = f"{slug}-shobo-soudan"
    src = BASE / "cities" / slug
    for f in ("service.ts", "stations.ts", "prompt.ts"):
        if not (src / f).exists():
            raise SystemExit(f"{slug}: {src / f} がない")
    out = OUT / sid
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.rmtree(out)
    shutil.copytree(BASE, out, ignore=lambda d, names: [n for n in names if n in IGNORE or (d == str(BASE) and n == "cities")])
    for f in ("service.ts", "stations.ts", "prompt.ts"):
        shutil.copy(src / f, out / "src/config" / f)

    # service.ts: ブランドの決定（画面上の名前は全地域「トドケデ AI」、地域名を添える）に合わせる
    svc = out / "src/config/service.ts"
    s = svc.read_text()
    s = re.sub(r'^ \* name・shortName は CITY_BRIEF\.md.*$', ' * name・shortName・area は全地域共通の決まり（画面上は「トドケデ AI」に市名を添える）に合わせて生成時に入れた。', s, flags=re.M)
    s = re.sub(r'\bid: "[^"]+"', f'id: "{sid}"', s, count=1)
    s = re.sub(r'\bname: "[^"]+",', f'name: "トドケデ AI（{ja}）",', s, count=1)
    s = re.sub(r'\bshortName: "[^"]+",', 'shortName: "トドケデ AI",', s, count=1)
    if "area:" not in s:
        s = s.replace(
            'shortName: "トドケデ AI",',
            'shortName: "トドケデ AI",\n  /** ヘッダーで名前の横に小さく添える地域名。全角6文字以内 */\n  area: "' + ja + '",',
            1,
        )
    else:
        s = re.sub(r'\barea: "[^"]+"', f'area: "{ja}"', s, count=1)
    svc.write_text(s)

    ns = namespace_for(sid)
    w = out / "wrangler.jsonc"
    sub(w, "nagoya-shobo-soudan", sid)
    sub(w, "nagoya.todokede.jp", f"{slug}.todokede.jp")
    sub(w, '"namespace_id": "6761"', f'"namespace_id": "{ns}"')
    sub(out / "package.json", '"name": "nagoya-shobo-soudan"', f'"name": "{sid}"')
    sub(out / "src/worker/chat.ts", 'runRules("nagoya-city"', f'runRules("{slug}-city"')

    # ドキュメント
    sub(out / "CLAUDE.md", "# 名古屋市 消防相談AI（meher-inc/service-template から作成）", f"# トドケデ AI（{ja}）（meher-inc/service-template から作成）")
    r = out / "README.md"
    rs = r.read_text()
    rs = rs.replace("# 名古屋市 消防相談AI", f"# トドケデ AI（{ja}）")
    rs = rs.replace("名古屋市内の事業所向けに", f"{ja}内の事業所向けに")
    rs = rs.replace("## 名古屋版で差し替えた内容", f"## {ja}版で差し替えた内容")
    rs = rs.replace("名古屋市消防局の公式ページで確認した事実だけを、出典URLと確認日つきで記載（提出先の区分、電子申請、防火対象物使用開始届＝火災予防条例第66条 など）",
                    f"{ja}の消防局の公式ページで確認した事実だけを、出典URLと確認日つきで記載")
    rs = rs.replace("名古屋市の情報は", f"{ja}の情報は")
    rs = rs.replace("nagoya.todokede.jp などのサブドメイン", f"{slug}.todokede.jp などのサブドメイン")
    rs = rs.replace("名古屋市火災予防条例・消防法等施行細則", f"{ja}火災予防条例・同規則（src/rules/cities/{slug}.ts、横浜市・大阪市は src/rules/filings.ts）")
    r.write_text(rs)

    (out / "docs/domain-setup.md").write_text(f"""# {slug}.todokede.jp の接続と公開設定

名古屋市版（nagoya-shobo-soudan）の `docs/domain-setup.md` と同じ構成。SaaS ゾーンは共通基盤の meher-edge.com。

| 項目 | 値 |
|---|---|
| Worker | {sid}（Workers Builds で meher-inc/{sid} の main を自動デプロイ。デプロイコマンド `pnpm run deploy`） |
| D1 | {sid}（`scripts/ensure-d1.mjs` が初回デプロイで作成） |
| カスタムホスト名 | {slug}.todokede.jp（meher-edge.com） |
| ルート | `{slug}.todokede.jp/*`（zone: meher-edge.com） |
| レート制限 | namespace_id {ns} |
| 正規URL | `CANONICAL_ORIGIN = https://{slug}.todokede.jp` |

todokede.jp の DNS（お名前.com）には、`{slug}` の CNAME（`customers.meher-edge.com`）と、Cloudflare が示す TXT（`_cf-custom-hostname.{slug}`）・CNAME（`_acme-challenge.{slug}`）を登録する。Google の OAuth クライアントの承認済みリダイレクト URI に `https://{slug}.todokede.jp/auth/callback` を追加する。
""")
    leftover = subprocess.run(["grep", "-rln", "名古屋\\|nagoya", "--exclude-dir=node_modules", "--exclude-dir=src/rules", str(out)], capture_output=True, text=True).stdout
    report = [p for p in leftover.split() if "/src/rules/" not in p and "/tests/unit/filings" not in p and "/tests/unit/install" not in p and "/eval/" not in p and "/docs/screenshots" not in p]
    shutil.copy(src / "notes.md", out / "docs/city-notes.md")
    print(f"{sid}: 生成 namespace={ns}" + (f"\n  名古屋の記述が残るファイル: {report}" if report else ""))
    return out


if __name__ == "__main__":
    for slug in sys.argv[2:] or CITIES:
        build(slug)

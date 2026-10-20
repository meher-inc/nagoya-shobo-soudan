# 回答の評価セット

`answer-cases.jsonl` は、回答の結論そのものを採点するための評価セット（1行1問）。京都市版・東京都版で共通。

| 項目 | 内容 |
|---|---|
| jurisdiction | `jp`（国）/ `kyoto-city` / `tokyo-tfd` / `nagoya-city` / `osaka-city` / `yokohama-city` |
| facts | 判定に使う物件条件 |
| expect | 期待する結論 |
| basis | 根拠の条文（文書名・条番号） |
| assertive | `false` の問いでは断定しないことを求める（特例・省令の除外が絡む） |
| status | `reviewed` は条文本文と照合済み（reviewed_by に確認者） |

- 第1弾53問（2026-10-19確認済み）。期待する結論は、取り込み済みの条文原文（e-Gov、京都市例規集）と照合した
- 自分の管轄に合わない問い（京都市版での `tokyo-tfd` など）は採点から外す
- 設計の詳細: トドケデ AI データスキーマ設計と評価セット（Claude Docs）

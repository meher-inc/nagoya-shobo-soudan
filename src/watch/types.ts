export type SourceKind = "egov" | "page" | "manual";

export interface Source {
  /** 台帳の中で一意。page/manual は URL の SHA-1 の先頭12桁、egov は egov-<法令ID> */
  id: string;
  kind: SourceKind;
  /** 何の資料か（notes.md の1列目やコメントの文から） */
  title: string;
  url: string;
  /** どの版の根拠か（英字の都市名、nagoya、national、common） */
  jurisdictions: string[];
}

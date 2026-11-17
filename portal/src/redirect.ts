/* ai.todokede.jp は 2026-11-17 に todokede.jp（消防の総合窓口）へ入口を一本化した（F-14）。
 * REDIRECT_TO が入っているときは、どのパスも REDIRECT_TO へ 301 で転送する。クエリ（utm など）は引き継ぐ。
 * 入口の画面を戻すときは wrangler.jsonc の REDIRECT_TO を空にする */
export function redirectTarget(requestUrl: string, redirectTo: string | undefined): string | null {
  if (!redirectTo) return null;
  const dest = new URL(redirectTo);
  const { searchParams } = new URL(requestUrl);
  searchParams.forEach((value, key) => dest.searchParams.append(key, value));
  return dest.toString();
}

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';

/**
 * Writes data to Google Sheet via Apps Script web app.
 * Uses no-cors so no CORS errors — fire and forget.
 */
export async function postToSheet(data: Record<string, unknown>): Promise<void> {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
    });
  } catch {
    // silently fail — local storage still has the data
  }
}

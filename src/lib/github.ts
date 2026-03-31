const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || ''; // e.g. "username/consent-forms"

export async function uploadPDFToGitHub(filename: string, base64Content: string): Promise<void> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.warn('GitHub upload not configured');
    return;
  }

  const path = `consents/${new Date().toISOString().slice(0, 10)}/${filename}`;
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

  try {
    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        message: `Add consent form: ${filename}`,
        content: base64Content,
      }),
    });
  } catch (err) {
    console.error('GitHub upload failed:', err);
  }
}

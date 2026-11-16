// Moving data between devices with a short code instead of pasting a long block of text (which phones
// cut short when it gets long). One device sends its data and gets a code; the other sends the code and
// gets the data back, once: it's deleted as soon as it's collected, and the code stops working.
// Same Vercel project and Blob store as the voice server. Self-contained, edge runtime.
export const config = { runtime: 'edge' };

const MAX_BYTES = 4_000_000;
// No 0/O, 1/I/L: a code someone reads off one screen and types into another.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN;
const blobUrl = (token: string, path: string) => `https://${token.split('_')[3]}.public.blob.vercel-storage.com/${path}`;
// The code goes into the file's name together with a long random part, so the file can't be found by
// trying codes against the storage directly; only through this function.
const pathFor = async (code: string) => {
  const secret = process.env.BLOB_READ_WRITE_TOKEN ?? '';
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:move:${code}`)));
  return `move/${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}.json`;
};

function reply(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

async function POST(request: Request) {
  const token = blobToken();
  if (!token) return reply(500, 'Moving data isn’t set up on the server yet.');
  const text = await request.text();
  if (!text || text.length > MAX_BYTES) return reply(400, 'That’s too much to send in one go.');
  try {
    if ((JSON.parse(text) as { app?: string }).app !== 'manifest-data') return reply(400, 'That isn’t data from this app.');
  } catch {
    return reply(400, 'That isn’t data from this app.');
  }
  const code = newCode();
  const res = await fetch(`https://vercel.com/api/blob/?${new URLSearchParams({ pathname: await pathFor(code) })}`, {
    method: 'PUT',
    body: text,
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-version': '13',
      'x-vercel-blob-access': 'public',
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-content-type': 'application/json',
      'x-cache-control-max-age': '0',
    },
  });
  if (!res.ok) {
    console.error('Could not store moved data', res.status, await res.text());
    return reply(502, 'Couldn’t save it just now. Try again.');
  }
  return Response.json({ code }, { headers: { 'Cache-Control': 'no-store' } });
}

async function GET(request: Request) {
  const token = blobToken();
  if (!token) return reply(500, 'Moving data isn’t set up on the server yet.');
  const code = (new URL(request.url).searchParams.get('code') ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (code.length !== CODE_LENGTH) return reply(400, `The code is ${CODE_LENGTH} letters and numbers.`);
  const url = blobUrl(token, await pathFor(code));
  const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return reply(404, 'That code didn’t match anything. It may have been used already: make a new one.');
  const text = await res.text();
  // Collected: delete it, so the code only ever works once.
  await fetch('https://vercel.com/api/blob/delete', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'x-api-version': '13', 'content-type': 'application/json' },
    body: JSON.stringify({ urls: [url] }),
  }).catch((e) => console.error('Could not delete moved data', e));
  return new Response(text, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export default function handler(request: Request) {
  if (request.method === 'GET') return GET(request);
  if (request.method === 'POST') return POST(request);
  return reply(405, 'Use GET or POST.');
}

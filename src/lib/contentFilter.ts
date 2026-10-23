// ============================================================================
// PesanBotol - Filter Kata Tidak Pantas (Profanity Filter)
// ============================================================================

/**
 * Daftar kata-kata tidak pantas / terlarang.
 * Anda dapat menambahkan kata-kata baru ke daftar ini kapan saja.
 */
export const INAPPROPRIATE_WORDS: string[] = [
  'bodoh',
  'tolol',
  'ngentot',
  'kontol',
  'setan',
  'memek',
  'bangsat',
  'bajingan',
  'babi',
  'anjing',
  'pantek',
  'itil',
  'jembut',
  'peler',
  'idiot',
  'brengsek',
  'tai',
  'taek',
];

/**
 * Normalisasi teks sederhana untuk mendeteksi variasi kata kotor
 * (misalnya penggunaan angka seperti b0d0h, k0nt0l, dll.)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@a]/g, 'a')
    .replace(/[0o]/g, 'o')
    .replace(/[1i!]/g, 'i')
    .replace(/[3e]/g, 'e')
    .replace(/[$s]/g, 's')
    .replace(/[^a-z0-9\\s]/g, ' ');
}

/**
 * Memeriksa apakah teks mengandung kata-kata yang tidak pantas.
 * @returns Array kata terlarang yang terdeteksi dalam teks (kosong jika aman).
 */
export function findInappropriateWords(text: string): string[] {
  if (!text || !text.trim()) return [];

  const rawLower = text.toLowerCase();
  const normalized = normalizeText(text);

  const found = new Set<string>();

  for (const word of INAPPROPRIATE_WORDS) {
    const wordPattern = new RegExp(`(^|\\s|[^a-z0-9])${word}([^a-z0-9]|\\s|$)`, 'i');
    if (wordPattern.test(rawLower) || wordPattern.test(normalized)) {
      found.add(word);
    }
  }

  return Array.from(found);
}

/**
 * Validasi cepat: mengembalikan true jika teks bersih dan aman.
 */
export function isContentAppropriate(text: string): boolean {
  return findInappropriateWords(text).length === 0;
}

#!/usr/bin/env node
/**
 * Yer tutucu ses efektleri uretir (assets/sounds/*.wav).
 *
 * NEDEN VAR: Spec 15 Turkce sesli efekt istiyor (simitci "Gunaydiiin!",
 * caydanlik, vapur duduğu...). Bunlar KAYIT gerektirir; kod uretemez.
 * Sessiz bir ses sistemi teslim etmek yerine, oyunun her etkilesimi icin
 * duyulabilir sentetik bir ton uretiliyor. Gercek kayitlar geldiginde
 * assets/sounds/ icindeki dosyalari degistirmek yeterli; kodda degisiklik
 * gerekmez.
 *
 * Calistirma: node scripts/generate-placeholder-sounds.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

/** 16-bit PCM mono WAV baslıgı + veri. */
function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((value, index) => {
    const clamped = Math.max(-1, Math.min(1, value));
    data.writeInt16LE(Math.round(clamped * 32767), index * 2);
  });

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM blok boyutu
  header.writeUInt16LE(1, 20); // format: PCM
  header.writeUInt16LE(1, 22); // kanal: mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte/sn
  header.writeUInt16LE(2, 32); // blok hizalama
  header.writeUInt16LE(16, 34); // bit derinligi
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

/**
 * Verilen frekans dizisini sirayla calan, ussel sonumlu bir ton uretir.
 * Sonum, tiklama sesini yumusatir ve kisa efektleri dogal gosterir.
 */
function tone(steps, totalSeconds) {
  const count = Math.floor(SAMPLE_RATE * totalSeconds);
  const perStep = count / steps.length;
  const samples = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const stepIndex = Math.min(steps.length - 1, Math.floor(i / perStep));
    const frequency = steps[stepIndex];
    const t = i / SAMPLE_RATE;
    const decay = Math.exp(-3.2 * (i / count));
    // Hafif ikinci harmonik, saf sinusun cok "elektronik" durmasini onler.
    const wave =
      Math.sin(2 * Math.PI * frequency * t) + 0.28 * Math.sin(4 * Math.PI * frequency * t);
    samples[i] = wave * decay * 0.32;
  }

  // Ilk ve son 5 ms'de kisa fade: hoparlorde "pat" sesi olusmasin.
  const fade = Math.floor(SAMPLE_RATE * 0.005);
  for (let i = 0; i < fade; i += 1) {
    samples[i] *= i / fade;
    samples[count - 1 - i] *= i / fade;
  }

  return samples;
}

const SOUNDS = {
  // Parca tahtaya oturdu: kisa, alcak, yumusak
  place: tone([320], 0.09),
  // Satir temizlendi: yukselen iki nota
  clear: tone([520, 780], 0.26),
  // Coklu temizleme: daha parlak, uc notali
  combo: tone([620, 830, 1040], 0.4),
  // Gecersiz birakma: alcak, kisa uyari
  invalid: tone([150, 120], 0.14),
  // Oyun sonu: inen dortlu
  gameOver: tone([540, 430, 340, 240], 0.75),
  // Cini (tek renkli cizgi): cay bardagi cinlamasi gibi tiz, parlak bir ping
  cini: tone([1320, 1760], 0.32),
  // Seviye atladi: vapur dudugu gibi alcak, uzun ve yukselen
  levelUp: tone([220, 330, 440], 0.55),
  // Yeni rekor: yukselen besli fanfar
  record: tone([523, 659, 784, 1047, 1319], 0.7),
  // Cay molasi: yumusak, sakinlestirici inis-cikis
  teaBreak: tone([392, 494, 392], 0.45),
};

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, samples] of Object.entries(SOUNDS)) {
  const file = join(OUT_DIR, `${name}.wav`);
  writeFileSync(file, toWav(samples));
  console.warn(`${name}.wav yazildi (${(samples.length / SAMPLE_RATE).toFixed(2)} sn)`);
}

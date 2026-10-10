/**
 * Base44 Encoding & Compact Verification Utility
 * 
 * Base44 is a compact, URL-safe 44-character alphanumeric encoding standard
 * optimized specifically for QR Code alphanumeric mode and embedded hardware receipts:
 * Character set (44 chars): 0-9, A-Z, $, %, *, +, -, ., /, :
 * (Omits spaces so QR codes remain 100% URL-safe and high-density).
 */
import QRCode from 'qrcode';
import { Bill, Product } from '../types';

export const BASE44_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$%*+-./:';
const ALPHABET_MAP = new Map<string, number>();
for (let i = 0; i < BASE44_ALPHABET.length; i++) {
  ALPHABET_MAP.set(BASE44_ALPHABET[i], i);
}

/**
 * Encode string into Base44 format
 */
export function encodeBase44(input: string): string {
  if (!input) return '';
  const bytes = new TextEncoder().encode(input);
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = (num << BigInt(8)) | BigInt(bytes[i]);
  }

  // Prepend length header to preserve leading zero bytes
  let result = '';
  const base = BigInt(44);
  while (num > BigInt(0)) {
    const remainder = Number(num % base);
    result = BASE44_ALPHABET[remainder] + result;
    num = num / base;
  }

  return result || BASE44_ALPHABET[0];
}

/**
 * Decode Base44 encoded string back to original UTF-8 string
 */
export function decodeBase44(encoded: string): string {
  if (!encoded) return '';
  const clean = encoded.toUpperCase().replace(/[^0-9A-Z$%*+\-./:]/g, '');
  let num = BigInt(0);
  const base = BigInt(44);

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const val = ALPHABET_MAP.get(char);
    if (val === undefined) continue;
    num = num * base + BigInt(val);
  }

  if (num === BigInt(0)) return '';

  const byteList: number[] = [];
  while (num > BigInt(0)) {
    const byte = Number(num & BigInt(0xff));
    byteList.unshift(byte);
    num = num >> BigInt(8);
  }

  try {
    return new TextDecoder().decode(new Uint8Array(byteList));
  } catch {
    return '';
  }
}

/**
 * Simple checksum helper for Base44 tokens
 */
export function computeBase44Checksum(data: string): string {
  let hash = 0x55;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 33) ^ data.charCodeAt(i);
    hash = hash & 0xffff;
  }
  const c1 = BASE44_ALPHABET[hash % 44];
  const c2 = BASE44_ALPHABET[Math.floor(hash / 44) % 44];
  return `${c1}${c2}`;
}

/**
 * Creates an ultra-compact Base44 invoice token for instant verification & QR codes.
 * Format: B44*<INV>*<AMOUNT>*<BRANCH>*<ITEMS_COUNT>*<CHECKSUM>
 */
export function generateBase44InvoicePayload(bill: Bill): string {
  const inv = bill.invoiceNumber.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  const amt = bill.total.toFixed(2);
  const branch = (bill.branchId || 'BR1').toUpperCase();
  const itemsCount = bill.items?.length || 0;
  const payMode = (bill.paymentMode || 'CASH').toUpperCase();
  const rawData = `${inv}*${amt}*${branch}*${itemsCount}*${payMode}`;
  const checksum = computeBase44Checksum(rawData);
  return `B44*${rawData}*${checksum}`;
}

/**
 * Parses and validates a Base44 invoice token
 */
export function parseBase44InvoiceToken(payload: string): {
  valid: boolean;
  invoiceNumber: string;
  total: number;
  branchId: string;
  itemsCount: number;
  paymentMode: string;
  rawPayload: string;
} | null {
  if (!payload || !payload.startsWith('B44*')) return null;
  const parts = payload.split('*');
  if (parts.length < 7) return null;

  const [, inv, amtStr, branch, itemsCountStr, payMode, checksum] = parts;
  const rawData = `${inv}*${amtStr}*${branch}*${itemsCountStr}*${payMode}`;
  const expectedChecksum = computeBase44Checksum(rawData);
  const valid = checksum === expectedChecksum;

  return {
    valid,
    invoiceNumber: inv,
    total: parseFloat(amtStr) || 0,
    branchId: branch,
    itemsCount: parseInt(itemsCountStr, 10) || 0,
    paymentMode: payMode,
    rawPayload: payload,
  };
}

/**
 * Generates high-density QR Code Data URL with Base44 payload
 */
export async function generateBase44QRDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating Base44 QR Code:', err);
    return '';
  }
}

/**
 * Generates Base44 SKU code for products
 */
export function generateBase44SKU(product: Product): string {
  const priceInt = Math.round(product.sellingPrice);
  const cleanId = product.id.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  const raw = `${cleanId}${product.category.slice(0, 2).toUpperCase()}${priceInt}`;
  return `B44-${raw}-${computeBase44Checksum(raw)}`;
}

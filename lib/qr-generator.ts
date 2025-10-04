import QRCode from 'qrcode'

// Opciones estándar para generar QRs consistentes
const STANDARD_QR_OPTIONS = {
  width: 300,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}

/**
 * Genera un QR con opciones estándar para mantener consistencia visual
 */
export async function generateStandardQR(data: string): Promise<string> {
  return await QRCode.toDataURL(data, STANDARD_QR_OPTIONS)
}

/**
 * Genera un QR como buffer con opciones estándar
 */
export async function generateStandardQRBuffer(data: string): Promise<Buffer> {
  return await QRCode.toBuffer(data, STANDARD_QR_OPTIONS)
}

export { STANDARD_QR_OPTIONS }


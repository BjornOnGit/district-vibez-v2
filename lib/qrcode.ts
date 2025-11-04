import * as QRCode from "qrcode"

export async function generateQRCodeDataUrl(data: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 1,
      width: 300,
    })
    return dataUrl
  } catch (error) {
    console.error("[v0] QR code generation error:", error)
    throw error
  }
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: "H",
      type: "png",
      margin: 1,
      width: 300,
    })
    return buffer
  } catch (error) {
    console.error("[v0] QR code generation error:", error)
    throw error
  }
}

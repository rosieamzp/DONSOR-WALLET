'use server'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

export type ScanReceiptResult =
  | { success: true; amount: number; note: string | null }
  | { error: string }

const ReceiptSchema = z.object({
  found_total: z.boolean().describe('照片中是否能判斷出一筆總金額（無論是直接寫明的總計，或是把清單各項金額加總算出）'),
  total_amount: z
    .number()
    .nullable()
    .describe('收據或發票上的總支付金額（不含幣別符號）；若照片是沒有標明總計的品項清單，請將所有品項金額加總後填入此欄位，找不到則為 null'),
  merchant_name: z.string().nullable().describe('店家或商家名稱，找不到則為 null'),
  reason_if_not_found: z
    .string()
    .nullable()
    .describe('若 found_total 為 false，說明原因（例如：照片模糊、沒有任何金額數字、非收據內容），否則為 null'),
})

export async function scanReceiptImage(
  _prevState: ScanReceiptResult | undefined,
  formData: FormData
): Promise<ScanReceiptResult> {
  const file = formData.get('image') as File | null
  if (!file || file.size === 0) {
    return { error: '請先選擇或拍攝一張照片' }
  }

  const mediaType = file.type
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
    return { error: '不支援的圖片格式，請使用 JPEG、PNG、WebP 或 GIF' }
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { error: 'AI 辨識服務尚未設定，請聯絡管理員' }
  }

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: '這是一張收據或發票的照片，請找出總支付金額（實際付款金額，不是折扣前金額）以及商家名稱。如果照片上有明確標示「總計」「合計」「應付金額」等欄位，直接使用該數字；如果照片只是一份品項清單、沒有標示總計欄位，請把清單上每一項的金額加總，算出總金額填入 total_amount。只有在照片模糊到無法辨識任何金額數字、或內容完全不是收據/發票/清單時，才將 found_total 設為 false 並說明原因。',
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(ReceiptSchema),
      },
    })

    const result = response.parsed_output
    if (!result) {
      return { error: '辨識失敗，請重新拍照或上傳其他張收據' }
    }

    if (!result.found_total || result.total_amount == null || result.total_amount <= 0) {
      return {
        error: result.reason_if_not_found || '無法從照片中辨識出總金額，請重新拍照或上傳其他張收據',
      }
    }

    return {
      success: true,
      amount: Math.round(result.total_amount * 100) / 100,
      note: result.merchant_name,
    }
  } catch {
    return { error: '辨識過程發生錯誤，請稍後再試' }
  }
}

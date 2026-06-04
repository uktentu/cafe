import { QRGenerator } from '@/components/cms/QRGenerator'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function QrCodesPage() {
  return <QRGenerator />
}

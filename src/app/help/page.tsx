import type { Metadata } from 'next'
import HelpContent from '@/components/help/HelpContent'

export const metadata: Metadata = {
  title: 'ヘルプ | カブノオト',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <HelpContent />
      </div>
    </div>
  )
}

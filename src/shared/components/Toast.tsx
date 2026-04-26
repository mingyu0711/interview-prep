import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'info' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmToast({ message, type = 'danger', onConfirm, onCancel }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const colorMap = {
    danger: { bar: 'bg-red-500', btn: 'bg-red-600 hover:bg-red-700 text-white' },
    info:   { bar: 'bg-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  }
  const colors = colorMap[type]

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-72">
        <div className={`h-1 ${colors.bar}`} />
        <div className="px-5 py-4 flex items-center justify-between gap-6">
          <p className="text-sm text-gray-800 font-medium">{message}</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${colors.btn}`}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

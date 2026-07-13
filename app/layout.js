import './globals.css'
import SwRegister from './sw-register'
import NotificationTracker from './notification-tracker'

export const metadata = {
  title: 'Metodo LEVE',
  description: 'Seu app diario de habitos para emagrecer com leveza',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LEVE',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4F6449',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <NotificationTracker />
        <SwRegister />
      </body>
    </html>
  )
}

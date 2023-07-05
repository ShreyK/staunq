import { Refresh } from './components/refresh'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Staunq',
  description: 'Staunq.com BTC ETH Crypto Finance Trading Tool Tracker Screener',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Refresh />
        {children}
        </body>
    </html>
  )
}

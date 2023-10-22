import { ChartContextProvider } from './_ui/context/chartContext';
import { Analytics } from '@vercel/analytics/react';
import './globals.css'
import { AddressBar } from './_ui/addressBar/addressBar';

export const metadata = {
  title: 'Staunq',
  description: 'Collaborating Crypto Trading - BTC ETH USDT',
}

export default function RootLayout({ params, children, chart, chat }) {
  return (
    <html lang="en">
      <body>
        <ChartContextProvider params={params} children={children}>
          <AddressBar />
          {children}
          {chart}
          {chat}
          <Analytics />
        </ChartContextProvider>
      </body>
    </html>
  )
}

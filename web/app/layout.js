import { AppContext, AppContextProvider, useAppContext } from './_ui/context/appContext';
import { Analytics } from '@vercel/analytics/react';
import './globals.css'
import styles from './page.module.css'
import { AddressBar } from './_ui/addressBar/addressBar';

export const metadata = {
  title: 'Staunq',
  description: 'Collaborating Crypto Trading - BTC ETH USDT',
}

export default function RootLayout({ params, children, chart, chat }) {
  return (
    <html lang="en">
      <body>
        <AppContextProvider params={params}>
          <AddressBar />
          {children}
          {chart}
          {chat}
          <Analytics />
        </AppContextProvider>
      </body>
    </html>
  )
}

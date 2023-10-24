import { Suspense } from "react";
import { ChartWrapper } from "@/app/_ui/chart/chartWrapper";

export default function RootLayout({ children }) {
  return (
    <Suspense fallback={<div>Loading</div>}>
      <ChartWrapper />
      {children}
    </Suspense>
  )
}

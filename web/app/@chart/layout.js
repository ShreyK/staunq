import { Suspense } from "react";
import { Chart } from "@/app/_ui/chart/chart";

export default function RootLayout({ children }) {
  return (
    <Suspense fallback={<div>Loading</div>}>
      {/* <ChartActions /> */}
      <Chart />
      {children}
    </Suspense>
  )
}

import { Chart } from "../_ui/chart/chart";
import { useAppContext } from "../_ui/context/appContext";

export default function RootLayout({ children }) {
  return (
    <>
      {/* <ChartActions /> */}
      <Chart />
      {children}
    </>
  )
}

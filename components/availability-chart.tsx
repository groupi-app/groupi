"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

const data = [
  {
    name: "Page A",
    Maybe: 4000,
    Yes: 2400,
  },
  {
    name: "Page B",
    Maybe: 3000,
    Yes: 1398,
  },
  {
    name: "Page C",
    Maybe: 2000,
    Yes: 9800,
  },
  {
    name: "Page D",
    Maybe: 2780,
    Yes: 3908,
  },
  {
    name: "Page E",
    Maybe: 1890,
    Yes: 4800,
  },
  {
    name: "Page F",
    Maybe: 2390,
    Yes: 3800,
  },
  {
    name: "Page G",
    Maybe: 3490,
    Yes: 4300,
  },
];

export function AvailabilityChart({ eventId }: { eventId: string }) {
  return (
    <ScrollArea className="w-full text-yellow-500">
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Yes" stackId="a" fill="#22c55e" />
        <Bar dataKey="Maybe" stackId="a" fill="#eab308" />
      </BarChart>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

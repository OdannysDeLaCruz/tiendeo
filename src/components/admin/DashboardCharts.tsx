"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProductsByCategoryData {
  name: string;
  count: number;
}

interface OrdersData {
  date: string;
  count: number;
}

interface DashboardChartsProps {
  productsByCategory: ProductsByCategoryData[];
  ordersData: OrdersData[];
}

export default function DashboardCharts({
  productsByCategory,
  ordersData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Productos por Categoría */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Productos por Categoría
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productsByCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3B82F6" name="Productos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Tendencia de Pedidos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tendencia de Pedidos (Últimos 30 días)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ordersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10B981"
              name="Pedidos"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

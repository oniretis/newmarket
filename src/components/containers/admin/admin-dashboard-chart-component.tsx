import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardChartData, type ChartDataPoint } from "./admin-dashboard-chart";
import { useQuery } from "@tanstack/react-query";

// Simple line chart component using SVG
function SimpleLineChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) return null;

  const width = 600;
  const height = 300;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Find max values for scaling
  const maxValue = Math.max(
    ...data.flatMap(d => [d.users, d.tenants, d.shops, d.products])
  );

  // Scale function
  const scaleY = (value: number) => 
    chartHeight - (value / maxValue) * chartHeight + padding;

  const scaleX = (index: number) => 
    (index / (data.length - 1)) * chartWidth + padding;

  // Generate paths for each metric
  const generatePath = (metric: keyof Omit<ChartDataPoint, 'month'>) => {
    return data
      .map((point, index) => {
        const x = scaleX(index);
        const y = scaleY(point[metric]);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const colors = {
    users: '#3b82f6', // blue
    tenants: '#10b981', // green
    shops: '#f59e0b', // amber
    products: '#ef4444', // red
  };

  return (
    <div className="w-full overflow-auto">
      <svg width={width} height={height} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i * chartHeight) / 4}
            x2={width - padding}
            y2={padding + (i * chartHeight) / 4}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* X-axis labels */}
        {data.map((point, index) => (
          <text
            key={index}
            x={scaleX(index)}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {point.month}
          </text>
        ))}

        {/* Lines for each metric */}
        <path
          d={generatePath('users')}
          fill="none"
          stroke={colors.users}
          strokeWidth="2"
        />
        <path
          d={generatePath('tenants')}
          fill="none"
          stroke={colors.tenants}
          strokeWidth="2"
        />
        <path
          d={generatePath('shops')}
          fill="none"
          stroke={colors.shops}
          strokeWidth="2"
        />
        <path
          d={generatePath('products')}
          fill="none"
          stroke={colors.products}
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((point, index) => (
          <g key={index}>
            <circle
              cx={scaleX(index)}
              cy={scaleY(point.users)}
              r="3"
              fill={colors.users}
            />
            <circle
              cx={scaleX(index)}
              cy={scaleY(point.tenants)}
              r="3"
              fill={colors.tenants}
            />
            <circle
              cx={scaleX(index)}
              cy={scaleY(point.shops)}
              r="3"
              fill={colors.shops}
            />
            <circle
              cx={scaleX(index)}
              cy={scaleY(point.products)}
              r="3"
              fill={colors.products}
            />
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm">Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm">Tenants</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm">Shops</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm">Products</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardChart() {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard-chart"],
    queryFn: () => getDashboardChartData(),
  });

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="flex h-75 items-center justify-center">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-32 w-full bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="flex h-75 items-center justify-center text-destructive">
            Error loading chart data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Platform Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {chartData && chartData.length > 0 ? (
          <SimpleLineChart data={chartData} />
        ) : (
          <div className="flex h-75 items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { UserCircleIcon, BoxIcon, ListIcon, ArrowUpIcon } from "../../icons";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, change, changeType, icon, color }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          <div className="flex items-center mt-2">
            <span
              className={`text-xs font-medium ${
                changeType === "increase"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {changeType === "increase" ? "↗" : "↘"} {change}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">so với tháng trước</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function EducationMetrics() {
  const metrics = [
    {
      title: "Tổng số Giáo viên",
      value: "248",
      change: "+12%",
      changeType: "increase" as const,
      icon: <UserCircleIcon className="h-6 w-6 text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "Tổng số Học sinh",
      value: "3,247",
      change: "+8%",
      changeType: "increase" as const,
      icon: <BoxIcon className="h-6 w-6 text-white" />,
      color: "bg-green-500",
    },
    {
      title: "Khóa học Hoạt động",
      value: "156",
      change: "+5%",
      changeType: "increase" as const,
      icon: <ListIcon className="h-6 w-6 text-white" />,
      color: "bg-purple-500",
    },
    {
      title: "Tỷ lệ Hoàn thành",
      value: "87.5%",
      change: "-2%",
      changeType: "decrease" as const,
      icon: <ArrowUpIcon className="h-6 w-6 text-white" />,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
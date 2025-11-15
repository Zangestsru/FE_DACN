interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: string;
  color: string;
  bgGradient: string;
}

function MetricCard({ title, value, change, changeType, icon, color, bgGradient }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      {/* Background Gradient */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 ${bgGradient}`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                changeType === "increase"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {changeType === "increase" ? "↑" : "↓"} {change}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">so với tháng trước</span>
          </div>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${color} shadow-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function EducationMetrics() {
  const metrics = [
    {
      title: "Tổng Học Sinh",
      value: "1,247",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: "👥",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Bài Thi Đã Tạo",
      value: "89",
      change: "+8.2%",
      changeType: "increase" as const,
      icon: "📝",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      bgGradient: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      title: "Khóa Học",
      value: "24",
      change: "+15.3%",
      changeType: "increase" as const,
      icon: "📚",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      bgGradient: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Điểm Trung Bình",
      value: "8.5",
      change: "+2.1%",
      changeType: "increase" as const,
      icon: "⭐",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
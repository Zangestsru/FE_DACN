import { useState, useEffect } from "react";
import { UserCircleIcon, BoxIcon, ListIcon, ArrowUpIcon } from "../../icons";
import { dashboardService, DashboardMetrics } from "../../services/dashboard.service";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function MetricCard({ title, value, change, changeType, icon, color, loading }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          )}
          <div className="flex items-center mt-2">
            {loading ? (
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <>
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
              </>
            )}
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Fallback to default values
        setMetrics({
          totalTeachers: 248,
          totalStudents: 3247,
          activeCourses: 156,
          completionRate: 87.5,
          teacherChange: 12,
          studentChange: 8,
          courseChange: 5,
          completionChange: -2,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const metricsData = [
    {
      title: "Tổng số Giáo viên",
      value: metrics ? formatNumber(metrics.totalTeachers) : "248",
      change: metrics ? `${metrics.teacherChange >= 0 ? '+' : ''}${metrics.teacherChange}%` : "+12%",
      changeType: (metrics?.teacherChange ?? 12) >= 0 ? "increase" as const : "decrease" as const,
      icon: <UserCircleIcon className="h-6 w-6 text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "Tổng số Học sinh",
      value: metrics ? formatNumber(metrics.totalStudents) : "3,247",
      change: metrics ? `${metrics.studentChange >= 0 ? '+' : ''}${metrics.studentChange}%` : "+8%",
      changeType: (metrics?.studentChange ?? 8) >= 0 ? "increase" as const : "decrease" as const,
      icon: <BoxIcon className="h-6 w-6 text-white" />,
      color: "bg-green-500",
    },
    {
      title: "Khóa học Hoạt động",
      value: metrics ? formatNumber(metrics.activeCourses) : "156",
      change: metrics ? `${metrics.courseChange >= 0 ? '+' : ''}${metrics.courseChange}%` : "+5%",
      changeType: (metrics?.courseChange ?? 5) >= 0 ? "increase" as const : "decrease" as const,
      icon: <ListIcon className="h-6 w-6 text-white" />,
      color: "bg-purple-500",
    },
    {
      title: "Tỷ lệ Hoàn thành",
      value: metrics ? formatPercentage(metrics.completionRate) : "87.5%",
      change: metrics ? `${metrics.completionChange >= 0 ? '+' : ''}${metrics.completionChange}%` : "-2%",
      changeType: (metrics?.completionChange ?? -2) >= 0 ? "increase" as const : "decrease" as const,
      icon: <ArrowUpIcon className="h-6 w-6 text-white" />,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => (
        <MetricCard key={index} {...metric} loading={loading} />
      ))}
    </div>
  );
}
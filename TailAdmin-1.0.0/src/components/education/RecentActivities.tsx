import { useState, useEffect } from "react";
import { UserIcon, CheckCircleIcon, FileIcon, ListIcon } from "../../icons";
import { dashboardService, RecentActivity } from "../../services/dashboard.service";

export default function RecentActivities() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getRecentActivities(5);
        setActivities(data);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        // Fallback to empty array, will use default data
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Use default activities if none loaded
  const displayActivities = activities.length > 0 ? activities : [
    {
      id: 1,
      type: "enrollment" as const,
      title: "Đăng ký khóa học mới",
      description: "Nguyễn Văn A đã đăng ký khóa Toán học cơ bản",
      time: "5 phút trước",
      user: "Nguyễn Văn A",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      type: "completion" as const,
      title: "Hoàn thành bài tập",
      description: "Trần Thị B đã hoàn thành bài tập Vật lý",
      time: "15 phút trước",
      user: "Trần Thị B",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      type: "exam" as const,
      title: "Thi kết thúc môn",
      description: "Lớp 12A1 đã hoàn thành kỳ thi Hóa học",
      time: "1 giờ trước",
      user: "Lớp 12A1",
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      type: "assignment" as const,
      title: "Giao bài tập mới",
      description: "GV. Phạm Văn C đã giao bài tập Văn học",
      time: "2 giờ trước",
      user: "GV. Phạm Văn C",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      type: "enrollment" as const,
      title: "Học sinh mới",
      description: "Lê Thị D đã được thêm vào hệ thống",
      time: "3 giờ trước",
      user: "Lê Thị D",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "enrollment":
        return <UserIcon className="w-4 h-4" />;
      case "completion":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "assignment":
        return <FileIcon className="w-4 h-4" />;
      case "exam":
        return <ListIcon className="w-4 h-4" />;
      default:
        return <FileIcon className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: RecentActivity["type"]) => {
    switch (type) {
      case "enrollment":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
      case "completion":
        return "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400";
      case "assignment":
        return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400";
      case "exam":
        return "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hoạt động Gần đây
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          Xem tất cả
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2"></div>
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
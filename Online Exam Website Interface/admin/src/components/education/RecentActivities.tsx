import { UserIcon, CheckCircleIcon, FileIcon, ListIcon } from "../../icons";

interface Activity {
  id: number;
  type: "enrollment" | "completion" | "assignment" | "exam";
  title: string;
  description: string;
  time: string;
  user: string;
}

export default function RecentActivities() {
  const activities: Activity[] = [
    {
      id: 1,
      type: "enrollment",
      title: "Đăng ký khóa học mới",
      description: "Nguyễn Văn A đã đăng ký khóa Toán học cơ bản",
      time: "5 phút trước",
      user: "Nguyễn Văn A",
    },
    {
      id: 2,
      type: "completion",
      title: "Hoàn thành bài tập",
      description: "Trần Thị B đã hoàn thành bài tập Vật lý",
      time: "15 phút trước",
      user: "Trần Thị B",
    },
    {
      id: 3,
      type: "exam",
      title: "Thi kết thúc môn",
      description: "Lớp 12A1 đã hoàn thành kỳ thi Hóa học",
      time: "1 giờ trước",
      user: "Lớp 12A1",
    },
    {
      id: 4,
      type: "assignment",
      title: "Giao bài tập mới",
      description: "GV. Phạm Văn C đã giao bài tập Văn học",
      time: "2 giờ trước",
      user: "GV. Phạm Văn C",
    },
    {
      id: 5,
      type: "enrollment",
      title: "Học sinh mới",
      description: "Lê Thị D đã được thêm vào hệ thống",
      time: "3 giờ trước",
      user: "Lê Thị D",
    },
  ];

  const getActivityIcon = (type: Activity["type"]) => {
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

  const getActivityColor = (type: Activity["type"]) => {
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
      
      <div className="space-y-4">
        {activities.map((activity) => (
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
    </div>
  );
}
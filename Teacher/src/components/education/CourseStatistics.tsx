import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function CourseStatistics() {
  const donutOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 250,
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    labels: ["Đang diễn ra", "Hoàn thành", "Sắp bắt đầu", "Tạm dừng"],
    legend: {
      show: true,
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Tổng khóa học",
              fontSize: "16px",
              fontWeight: 600,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };

  const donutSeries = [89, 45, 15, 7];

  const courseData = [
    {
      subject: "Toán học",
      totalCourses: 25,
      activeCourses: 22,
      completionRate: 88,
      avgRating: 4.5,
    },
    {
      subject: "Vật lý",
      totalCourses: 18,
      activeCourses: 16,
      completionRate: 85,
      avgRating: 4.3,
    },
    {
      subject: "Hóa học",
      totalCourses: 20,
      activeCourses: 18,
      completionRate: 82,
      avgRating: 4.2,
    },
    {
      subject: "Sinh học",
      totalCourses: 15,
      activeCourses: 13,
      completionRate: 90,
      avgRating: 4.6,
    },
    {
      subject: "Văn học",
      totalCourses: 22,
      activeCourses: 20,
      completionRate: 87,
      avgRating: 4.4,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Thống kê Khóa học
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tổng quan về tình trạng và hiệu quả các khóa học
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex justify-center">
          <Chart
            options={donutOptions}
            series={donutSeries}
            type="donut"
            height={250}
          />
        </div>

        {/* Course Details Table */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Chi tiết theo Môn học
          </h4>
          <div className="space-y-3">
            {courseData.map((course, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.subject}
                  </h5>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {course.activeCourses}/{course.totalCourses} khóa
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {course.completionRate}% hoàn thành
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.avgRating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng khóa học</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">89</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang diễn ra</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">87%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ hoàn thành</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">4.4</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá TB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
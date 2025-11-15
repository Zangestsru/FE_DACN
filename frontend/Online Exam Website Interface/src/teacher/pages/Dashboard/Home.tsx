import EducationMetrics from "../../components/education/EducationMetrics";
// import CourseStatistics from "../../components/education/CourseStatistics";
import StudentEnrollmentChart from "../../components/education/StudentEnrollmentChart";
import ExamResults from "../../components/education/ExamResults";
import RecentActivities from "../../components/education/RecentActivities";
// import TeacherPerformanceChart from "../../components/education/TeacherPerformanceChart";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Teacher Dashboard | Quản Lý Giảng Dạy"
        description="Dashboard quản lý giảng dạy - Theo dõi học sinh, bài thi và hoạt động"
      />
      
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chào mừng trở lại! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Đây là tổng quan về hoạt động giảng dạy của bạn
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12">
        
        {/* Metrics Cards - Full Width */}
        <div className="xl:col-span-12">
          <EducationMetrics />
        </div>

        {/* Course Statistics - Placeholder (tạm thời bỏ chart) */}
        <div className="xl:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📚 Thống kê Khóa học
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Biểu đồ sẽ được hiển thị sau khi sửa lỗi ApexCharts
            </p>
          </div>
        </div>

        {/* Recent Activities - 5 columns */}
        <div className="xl:col-span-5">
          <RecentActivities />
        </div>

        {/* Student Enrollment Chart - Placeholder */}
        <div className="xl:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Thống kê Đăng ký Học sinh
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Biểu đồ sẽ được hiển thị sau khi sửa lỗi ApexCharts
            </p>
          </div>
        </div>

        {/* Teacher Performance - Placeholder */}
        <div className="xl:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Hiệu suất Môn học
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Biểu đồ sẽ được hiển thị sau khi sửa lỗi ApexCharts
            </p>
          </div>
        </div>

        {/* Exam Results - Full Width */}
        <div className="xl:col-span-12">
          <ExamResults />
        </div>
      </div>
    </>
  );
}

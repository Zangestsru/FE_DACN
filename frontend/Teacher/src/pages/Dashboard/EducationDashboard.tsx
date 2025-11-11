import PageMeta from "../../components/common/PageMeta";
import EducationMetrics from "../../components/education/EducationMetrics";
import StudentEnrollmentChart from "../../components/education/StudentEnrollmentChart";
import TeacherPerformanceChart from "../../components/education/TeacherPerformanceChart";
import RecentActivities from "../../components/education/RecentActivities";
import CourseStatistics from "../../components/education/CourseStatistics";
import ExamResults from "../../components/education/ExamResults";

export default function EducationDashboard() {
  return (
    <>
      <PageMeta
        title="Dashboard Quản Lý Giáo Dục | TailAdmin - React.js Admin Dashboard Template"
        description="Dashboard tổng quan cho hệ thống quản lý giáo dục với các thống kê về giáo viên, học sinh và khóa học"
      />
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Dashboard Quản Lý Giáo Dục
        </h1>
        
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Metrics Cards */}
          <div className="col-span-12">
            <EducationMetrics />
          </div>

          {/* Charts Section */}
          <div className="col-span-12 space-y-6 xl:col-span-8">
            <StudentEnrollmentChart />
            <TeacherPerformanceChart />
          </div>

          {/* Side Panel */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <RecentActivities />
            <ExamResults />
          </div>

          {/* Course Statistics */}
          <div className="col-span-12">
            <CourseStatistics />
          </div>
        </div>
      </div>
    </>
  );
}
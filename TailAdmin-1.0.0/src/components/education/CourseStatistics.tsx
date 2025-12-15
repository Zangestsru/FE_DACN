import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { coursesService } from "../../services/courses.service";
import { subjectsService } from "../../services/subjects.service";
import { dashboardService } from "../../services/dashboard.service";

interface CourseStats {
  subject: string;
  totalCourses: number;
  activeCourses: number;
  completionRate: number;
  avgRating: number;
}

export default function CourseStatistics() {
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [donutData, setDonutData] = useState([89, 45, 15, 7]);
  const [loading, setLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(156);
  const [activeCourses, setActiveCourses] = useState(89);
  const [completionRate, setCompletionRate] = useState(87);
  const [avgRating, setAvgRating] = useState(4.4);
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

  useEffect(() => {
    const fetchCourseStatistics = async () => {
      try {
        setLoading(true);
        const [coursesResponse, subjectsResponse, dashboardMetrics] = await Promise.all([
          coursesService.getCourses({ pageSize: 1000 }),
          subjectsService.getSubjects(),
          dashboardService.getDashboardMetrics(),
        ]);

        const courses = coursesResponse.items || [];
        const subjects = subjectsResponse || [];

        // Use completion rate from dashboard service for consistency
        const syncedCompletionRate = dashboardMetrics?.completionRate || 0;

        // Group courses by subject
        const statsBySubject: Record<string, CourseStats> = {};

        subjects.forEach(subject => {
          const subjectCourses = courses.filter(c =>
            c.subjectId === subject.subjectId || c.subjectName === subject.name
          );
          const activeCourses = subjectCourses.filter(c =>
            c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'published'
          ).length;

          statsBySubject[subject.name] = {
            subject: subject.name,
            totalCourses: subjectCourses.length,
            activeCourses,
            completionRate: subjectCourses.length > 0
              ? Math.round((activeCourses / subjectCourses.length) * 100)
              : 0,
            avgRating: 4.0 + Math.random() * 0.8, // Mock rating for now
          };
        });

        const stats = Object.values(statsBySubject).slice(0, 5);

        // Calculate totals
        const total = courses.length;
        const active = courses.filter(c =>
          c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'published'
        ).length;
        const completed = courses.filter(c =>
          c.status?.toLowerCase() === 'completed'
        ).length;
        const upcoming = courses.filter(c =>
          c.status?.toLowerCase() === 'upcoming' || c.status?.toLowerCase() === 'draft'
        ).length;
        const paused = courses.filter(c =>
          c.status?.toLowerCase() === 'paused' || c.status?.toLowerCase() === 'inactive'
        ).length;

        setDonutData([active, completed, upcoming, paused]);
        setTotalCourses(total);
        setActiveCourses(active);

        // Use synced completion rate from dashboard service for consistency with EducationMetrics
        // This ensures the same value is displayed in both the top metrics and bottom statistics
        setCompletionRate(syncedCompletionRate > 0 ? syncedCompletionRate : Math.round((active / total) * 100));

        // Calculate average rating from courses
        const validRatings = (courses as any[]).filter(c => c.rating && c.rating > 0);
        const avgRatingCalc = validRatings.length > 0
          ? validRatings.reduce((acc, c) => acc + (c.rating || 0), 0) / validRatings.length
          : 4.4;
        setAvgRating(avgRatingCalc);

        setCourseStats(stats.length > 0 ? stats : getDefaultCourseData());
      } catch (error) {
        console.error('Error fetching course statistics:', error);
        setCourseStats(getDefaultCourseData());
      } finally {
        setLoading(false);
      }
    };

    fetchCourseStatistics();
  }, []);

  const getDefaultCourseData = (): CourseStats[] => [
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
          {loading ? (
            <div className="flex items-center justify-center h-[250px] w-full">
              <div className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <Chart
              options={donutOptions}
              series={donutData}
              type="donut"
              height={250}
            />
          )}
        </div>

        {/* Course Details Table */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Chi tiết theo Môn học
          </h4>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2"></div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {courseStats.map((course, index) => (
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
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mx-auto mb-2"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCourses}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng khóa học</p>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mx-auto mb-2"></div>
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCourses}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang diễn ra</p>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mx-auto mb-2"></div>
            ) : (
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completionRate}%</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ hoàn thành</p>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mx-auto mb-2"></div>
            ) : (
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{avgRating.toFixed(1)}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá TB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
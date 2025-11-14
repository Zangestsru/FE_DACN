import { useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, DownloadIcon } from "../../admin/icons";
import { Modal } from "../components/ui/modal";

type ExamStatistic = {
  id: string;
  examName: string;
  subject: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  duration: number;
  date: string;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
};

export default function Statistics() {
  const examStats = useMemo<ExamStatistic[]>(
    () => [
      {
        id: "exam1",
        examName: "Kiểm tra Toán học Lớp 10 - Chương 1",
        subject: "Toán học",
        totalParticipants: 120,
        averageScore: 7.5,
        highestScore: 10,
        lowestScore: 3.5,
        passRate: 85.5,
        duration: 90,
        date: "2024-01-15",
        scoreDistribution: [
          { range: "9-10", count: 25, percentage: 20.8 },
          { range: "8-8.9", count: 35, percentage: 29.2 },
          { range: "7-7.9", count: 30, percentage: 25.0 },
          { range: "6-6.9", count: 15, percentage: 12.5 },
          { range: "5-5.9", count: 10, percentage: 8.3 },
          { range: "0-4.9", count: 5, percentage: 4.2 }
        ]
      },
      {
        id: "exam2",
        examName: "Bài thi Văn học - Phân tích tác phẩm",
        subject: "Văn học",
        totalParticipants: 95,
        averageScore: 6.8,
        highestScore: 9.5,
        lowestScore: 2.0,
        passRate: 78.9,
        duration: 120,
        date: "2024-01-18",
        scoreDistribution: [
          { range: "9-10", count: 8, percentage: 8.4 },
          { range: "8-8.9", count: 20, percentage: 21.1 },
          { range: "7-7.9", count: 25, percentage: 26.3 },
          { range: "6-6.9", count: 22, percentage: 23.2 },
          { range: "5-5.9", count: 15, percentage: 15.8 },
          { range: "0-4.9", count: 5, percentage: 5.3 }
        ]
      },
      {
        id: "exam3",
        examName: "Kiểm tra Tiếng Anh - Unit 1-3",
        subject: "Tiếng Anh",
        totalParticipants: 110,
        averageScore: 8.2,
        highestScore: 10,
        lowestScore: 4.5,
        passRate: 92.7,
        duration: 60,
        date: "2024-01-20",
        scoreDistribution: [
          { range: "9-10", count: 40, percentage: 36.4 },
          { range: "8-8.9", count: 35, percentage: 31.8 },
          { range: "7-7.9", count: 20, percentage: 18.2 },
          { range: "6-6.9", count: 10, percentage: 9.1 },
          { range: "5-5.9", count: 3, percentage: 2.7 },
          { range: "0-4.9", count: 2, percentage: 1.8 }
        ]
      }
    ],
    []
  );

  const [selectedExam, setSelectedExam] = useState<ExamStatistic | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters
  const [subjectQuery, setSubjectQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");

  const filteredStats = useMemo(() => {
    return examStats.filter((stat) => {
      const matchSubject = !subjectQuery || stat.subject.toLowerCase().includes(subjectQuery.toLowerCase());
      const matchDate = !dateQuery || stat.date.includes(dateQuery);
      return matchSubject && matchDate;
    });
  }, [examStats, subjectQuery, dateQuery]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalExams = filteredStats.length;
    const totalParticipants = filteredStats.reduce((sum, stat) => sum + stat.totalParticipants, 0);
    const avgScore = filteredStats.reduce((sum, stat) => sum + stat.averageScore, 0) / totalExams;
    const avgPassRate = filteredStats.reduce((sum, stat) => sum + stat.passRate, 0) / totalExams;

    return {
      totalExams,
      totalParticipants,
      avgScore: avgScore || 0,
      avgPassRate: avgPassRate || 0
    };
  }, [filteredStats]);

  const openDetail = (exam: ExamStatistic) => {
    setSelectedExam(exam);
    setIsDetailOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      <PageMeta title="Thống Kê Bài Thi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Thống Kê Bài Thi</h1>
          <Button startIcon={<DownloadIcon className="h-4 w-4" />}>
            Xuất Báo Cáo
          </Button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600">{overallStats.totalExams}</div>
            <div className="text-sm text-gray-500">Tổng số bài thi</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-green-600">{overallStats.totalParticipants}</div>
            <div className="text-sm text-gray-500">Tổng thí sinh</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-purple-600">{overallStats.avgScore.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Điểm trung bình</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-orange-600">{overallStats.avgPassRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Tỷ lệ đậu TB</div>
          </div>
        </div>

        {/* Top Performing Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Môn Học Có Điểm Cao Nhất</h3>
            <div className="space-y-3">
              {[...new Set(filteredStats.map(s => s.subject))]
                .map(subject => {
                  const subjectStats = filteredStats.filter(s => s.subject === subject);
                  const avgScore = subjectStats.reduce((sum, s) => sum + s.averageScore, 0) / subjectStats.length;
                  return { subject, avgScore };
                })
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={item.subject} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.subject}</span>
                    </div>
                    <span className={`font-bold ${getScoreColor(item.avgScore)}`}>
                      {item.avgScore.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Phân Bố Điểm Số Chung</h3>
            <div className="space-y-2">
              {["9-10", "8-8.9", "7-7.9", "6-6.9", "5-5.9", "0-4.9"].map(range => {
                const totalInRange = filteredStats.reduce((sum, stat) => {
                  const rangeData = stat.scoreDistribution.find(d => d.range === range);
                  return sum + (rangeData?.count || 0);
                }, 0);
                const percentage = overallStats.totalParticipants > 0 
                  ? (totalInRange / overallStats.totalParticipants * 100) 
                  : 0;
                
                return (
                  <div key={range} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{range} điểm</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            placeholder="Lọc theo môn học"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={dateQuery}
            onChange={(e) => setDateQuery(e.target.value)}
            placeholder="Lọc theo ngày (YYYY-MM-DD)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <div className="text-sm text-gray-500 flex items-center">
            Hiển thị {filteredStats.length} / {examStats.length} bài thi
          </div>
        </div>

        {/* Exam Statistics Table */}
        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên bài thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thí sinh</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm TB</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ đậu</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStats.map((stat) => (
                <TableRow key={stat.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {stat.examName}
                      </div>
                      <div className="text-xs text-gray-500">ID: {stat.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-blue-200 text-blue-600 dark:ring-blue-900/40">
                      {stat.subject}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{stat.totalParticipants}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`font-bold ${getScoreColor(stat.averageScore)}`}>
                      {stat.averageScore.toFixed(1)}
                    </span>
                    <div className="text-xs text-gray-500">
                      {stat.lowestScore} - {stat.highestScore}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`font-bold ${getPassRateColor(stat.passRate)}`}>
                      {stat.passRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{stat.date}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />} onClick={() => openDetail(stat)}>
                        Chi tiết
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-4xl p-6">
        {selectedExam && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Chi Tiết Thống Kê Bài Thi</h3>
              <Button variant="outline" startIcon={<DownloadIcon className="h-4 w-4" />}>
                Xuất PDF
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Thông Tin Chung</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên bài thi:</span>
                    <span className="font-medium">{selectedExam.examName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Môn học:</span>
                    <span className="font-medium">{selectedExam.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thi:</span>
                    <span className="font-medium">{selectedExam.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-medium">{selectedExam.duration} phút</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng thí sinh:</span>
                    <span className="font-medium">{selectedExam.totalParticipants}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Kết Quả</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điểm trung bình:</span>
                    <span className={`font-bold ${getScoreColor(selectedExam.averageScore)}`}>
                      {selectedExam.averageScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điểm cao nhất:</span>
                    <span className="font-medium text-green-600">{selectedExam.highestScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điểm thấp nhất:</span>
                    <span className="font-medium text-red-600">{selectedExam.lowestScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tỷ lệ đậu:</span>
                    <span className={`font-bold ${getPassRateColor(selectedExam.passRate)}`}>
                      {selectedExam.passRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Phân Bố Điểm Số</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedExam.scoreDistribution.map((dist) => (
                  <div key={dist.range} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{dist.count}</div>
                      <div className="text-sm text-gray-500">{dist.range} điểm</div>
                      <div className="text-xs text-gray-400">{dist.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}



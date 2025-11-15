interface ExamResult {
  id: number;
  subject: string;
  class: string;
  averageScore: number;
  totalStudents: number;
  passRate: number;
  date: string;
}

export default function ExamResults() {
  const examResults: ExamResult[] = [
    {
      id: 1,
      subject: "Toán học",
      class: "12A1",
      averageScore: 8.5,
      totalStudents: 35,
      passRate: 94,
      date: "2024-01-15",
    },
    {
      id: 2,
      subject: "Vật lý",
      class: "11B2",
      averageScore: 7.8,
      totalStudents: 32,
      passRate: 87,
      date: "2024-01-14",
    },
    {
      id: 3,
      subject: "Hóa học",
      class: "10C1",
      averageScore: 7.2,
      totalStudents: 38,
      passRate: 82,
      date: "2024-01-13",
    },
    {
      id: 4,
      subject: "Văn học",
      class: "12A2",
      averageScore: 8.1,
      totalStudents: 33,
      passRate: 91,
      date: "2024-01-12",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6.5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (rate >= 80) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📊 Kết quả Thi gần đây
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tổng hợp kết quả các kỳ thi mới nhất
          </p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          Xem chi tiết →
        </button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:gap-6">
        {examResults.map((result) => (
          <div key={result.id} className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:from-gray-800 dark:to-gray-900">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500 opacity-5"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {result.subject}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Lớp {result.class} • {new Date(result.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold ${getScoreColor(result.averageScore).replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')} ${getScoreColor(result.averageScore)}`}>
                  {result.averageScore}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  👥 {result.totalStudents} học sinh
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPassRateColor(result.passRate)}`}>
                  ✓ {result.passRate}% đạt
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Điểm trung bình chung:</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">7.9<span className="text-sm text-gray-500">/10</span></span>
        </div>
      </div>
    </div>
  );
}
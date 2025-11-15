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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kết quả Thi gần đây
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          Xem chi tiết
        </button>
      </div>
      
      <div className="space-y-4">
        {examResults.map((result) => (
          <div key={result.id} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {result.subject} - {result.class}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(result.date).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(result.averageScore)}`}>
                {result.averageScore}/10
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {result.totalStudents} học sinh
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPassRateColor(result.passRate)}`}>
                {result.passRate}% đạt
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Điểm trung bình chung:</span>
          <span className="font-semibold text-gray-900 dark:text-white">7.9/10</span>
        </div>
      </div>
    </div>
  );
}
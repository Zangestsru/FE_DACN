import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function TeacherPerformanceChart() {
  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    colors: ["#8B5CF6", "#EC4899", "#F97316"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 300,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: [
        "Toán học",
        "Vật lý", 
        "Hóa học",
        "Sinh học",
        "Văn học",
        "Lịch sử",
        "Địa lý",
        "Tiếng Anh",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "Điểm đánh giá",
        style: {
          fontSize: "14px",
          color: "#6B7280",
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " điểm";
        },
      },
    },
  };

  const series = [
    {
      name: "Chất lượng giảng dạy",
      data: [8.5, 8.2, 8.8, 8.1, 8.6, 8.3, 8.4, 8.7],
    },
    {
      name: "Tương tác với học sinh",
      data: [8.1, 8.4, 8.3, 8.6, 8.2, 8.5, 8.1, 8.8],
    },
    {
      name: "Kết quả học tập",
      data: [7.8, 8.0, 8.2, 7.9, 8.1, 7.7, 8.3, 8.4],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hiệu suất Giáo viên theo Môn học
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đánh giá chất lượng giảng dạy và kết quả học tập
        </p>
      </div>
      
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div id="teacherPerformanceChart" className="min-w-[600px]">
          <Chart options={options} series={series} type="bar" height={300} />
        </div>
      </div>
    </div>
  );
}
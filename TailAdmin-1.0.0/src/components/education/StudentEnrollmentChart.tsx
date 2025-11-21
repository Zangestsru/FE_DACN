import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function StudentEnrollmentChart() {
  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 350,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.3,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
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
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: [
        "Tháng 1",
        "Tháng 2", 
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
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
        text: "Số lượng học sinh",
        style: {
          fontSize: "14px",
          color: "#6B7280",
        },
      },
    },
  };

  const series = [
    {
      name: "Đăng ký mới",
      data: [120, 135, 145, 160, 180, 195, 210, 225, 240, 255, 270, 285],
    },
    {
      name: "Học sinh hoạt động",
      data: [2800, 2850, 2920, 3000, 3080, 3150, 3200, 3180, 3220, 3250, 3280, 3247],
    },
    {
      name: "Hoàn thành khóa học",
      data: [45, 52, 48, 65, 72, 68, 75, 82, 78, 85, 92, 88],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Thống kê Đăng ký Học sinh
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Theo dõi xu hướng đăng ký và hoạt động của học sinh
        </p>
      </div>
      
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div id="studentEnrollmentChart" className="min-w-[800px]">
          <Chart options={options} series={series} type="area" height={350} />
        </div>
      </div>
    </div>
  );
}
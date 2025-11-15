import { Link } from "react-router-dom";

export default function FlyonSidebar() {
  return (
    <aside
      id="collapsible-mini-sidebar"
      className="overlay [--auto-close:sm] overlay-minified:w-17 sm:shadow-none overlay-open:translate-x-0 drawer drawer-start hidden w-66 sm:absolute sm:z-0 sm:flex sm:translate-x-0 border-e border-base-content/20"
      role="dialog"
      tabIndex={-1}
    >
      <div className="drawer-header overlay-minified:px-3.75 py-2 w-full flex items-center justify-between gap-3">
        <h3 className="drawer-title text-xl font-semibold overlay-minified:hidden">FlyonUI</h3>
        <div className="hidden sm:block">
          <button
            type="button"
            className="btn btn-circle btn-text"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls="collapsible-mini-sidebar"
            aria-label="Minify navigation"
            data-overlay-minifier="#collapsible-mini-sidebar"
          >
            <span className="icon-[tabler--menu-2] size-5"></span>
            <span className="sr-only">Navigation Toggle</span>
          </button>
        </div>
      </div>
      <div className="drawer-body px-2 pt-4">
        <ul className="menu p-0">
          <li>
            <Link to="/teacher/education-dashboard">
              <span className="icon-[tabler--home] size-5"></span>
              <span className="overlay-minified:hidden">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/questions">
              <span className="icon-[tabler--message] size-5"></span>
              <span className="overlay-minified:hidden">Quản Lý Câu Hỏi</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/exams">
              <span className="icon-[tabler--calendar] size-5"></span>
              <span className="overlay-minified:hidden">Quản Lý Bài Thi</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/students">
              <span className="icon-[tabler--user] size-5"></span>
              <span className="overlay-minified:hidden">Quản Lý Học Viên</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/mock-exams">
              <span className="icon-[tabler--apps] size-5"></span>
              <span className="overlay-minified:hidden">Quản Lý Bài Thi Thử</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/statistics">
              <span className="icon-[tabler--chart-bar] size-5"></span>
              <span className="overlay-minified:hidden">Thống Kê</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/chat">
              <span className="icon-[tabler--message] size-5"></span>
              <span className="overlay-minified:hidden">Chat</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/feedback">
              <span className="icon-[tabler--mail] size-5"></span>
              <span className="overlay-minified:hidden">Feedback</span>
            </Link>
          </li>
          <li>
            <Link to="/teacher/reports">
              <span className="icon-[tabler--alert-triangle] size-5"></span>
              <span className="overlay-minified:hidden">Report</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
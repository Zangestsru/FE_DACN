import { useRef, useState, useEffect } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { notificationService } from "../../services/notification.service";

export default function NotificationDropdown() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);
  
  const { notifications, unreadCount, markAsRead, newNotification } = useNotifications();

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [dropdownOpen]);

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [dropdownOpen]);

  const handleToggle = () => {
      setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="relative">
      {/* Realtime Popup (Toast) above the bell */}
      {newNotification && !dropdownOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 text-sm z-50 animate-bounce">
            <div className="font-bold text-gray-800 dark:text-white mb-1">{newNotification.title}</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs truncate">{newNotification.message}</div>
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 rotate-45"></div>
        </div>
      )}

      <button
        ref={trigger}
        onClick={handleToggle}
        className={`relative flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all duration-300
            ${dropdownOpen ? 'bg-gray-200 dark:bg-white/30' : 'bg-gray-100 dark:bg-white/20'}
            hover:bg-gray-200 dark:hover:bg-white/30
            text-gray-600 dark:text-white
        `}
      >
        <span
          className={`absolute -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-red-500 ${
            unreadCount === 0 ? "hidden" : "inline"
          }`}
        >
          <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
        </span>
        
        {/* SVG Bell Icon with Namespace */}
        <svg
          className="fill-current duration-300 ease-in-out"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {dropdownOpen && (
        <div
          ref={dropdown}
          className="absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80 z-99999"
        >
          <div className="px-4 py-3 border-b border-stroke dark:border-strokedark">
            <h5 className="text-sm font-medium text-bodydark2 dark:text-white">Notification</h5>
          </div>

          <ul className="flex flex-col overflow-y-auto max-h-[300px]">
            {notifications.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500 text-center">No notifications</li>
            ) : (
                notifications.map((notification) => (
                <li key={notification.id}>
                    <div
                    className={`flex flex-col gap-2.5 border-b border-stroke px-4 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 cursor-pointer transition-colors ${!notification.isRead ? 'bg-gray-50 dark:bg-white/5' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                    >
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                        <span className={`block font-bold ${!notification.isRead ? 'text-black dark:text-white' : ''}`}>
                            {notification.title}
                        </span>
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    </div>
                </li>
                ))
            )}
          </ul>
          
          {/* Dev Tool: Simulate Notification */}
          <div className="border-t border-stroke p-2 text-center dark:border-strokedark">
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    notificationService.simulateNotification({
                        id: Date.now(),
                        title: "New Exam Purchase",
                        message: "User John Doe purchased 'Math 101'",
                        type: 'payment',
                        createdAt: new Date().toISOString(),
                        isRead: false
                    });
                }}
                className="text-xs text-primary hover:underline"
             >
                 Test Notification
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "react-router";
import { chatService } from "../../services/chat.service";
import { NotificationItem } from "../../types/chat.types";
import { apiService } from "../../services/api.service";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const storageKey = useMemo(() => "teacher_notifications", []);

  // Use absolute URL pointing to frontend origin to ensure requests go through Vite proxy
  const NOTIFICATIONS_API_URL = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/notifications`
    : '/api/notifications';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: NotificationItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch (e) { void e; }
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        // Use apiService but with full URL to go through proxy to port 5004
        // Or use fetch directly if apiService is too strict
        // But apiService handles headers better.
        // Since apiService.get accepts absolute URL, we use that.
        const resp: any = await apiService.get(NOTIFICATIONS_API_URL);
        
        // apiService returns data directly if success, but we need to check structure
        // The previous code handled raw fetch response. apiService handles response.json().
        // Let's assume apiService returns the parsed body.
        
        const list = resp?.data || resp?.Data || resp || [];
        
        if (!cancelled && Array.isArray(list)) {
          setNotifications(prev => {
            const merged = ([...list, ...prev] as NotificationItem[]).reduce((acc: NotificationItem[], cur: NotificationItem) => {
              if (!acc.find(x => x.NotificationId === cur.NotificationId)) acc.push(cur);
              return acc;
            }, []);
            try { localStorage.setItem(storageKey, JSON.stringify(merged)); } catch (e) { void e; }
            return merged;
          });
        }
      } catch (e) { 
        // Silent fail
      }
    };

    fetchUnread();
    
    // Connect to SignalR
    chatService.connect().catch(() => {});

    // Subscribe to notifications
    const unsubscribe = chatService.onNotificationReceived((payload) => {
      setNotifications(prev => {
        const next = [payload, ...prev].slice(0, 200);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) { void e; }
        return next;
      });
      setNotifying(true);
    });

    return () => { 
      cancelled = true; 
      unsubscribe();
      // We do NOT disconnect here because ChatService is global/shared
      // and we might be navigating between pages.
      // However, if the user logs out or closes app, it disconnects.
    };
  }, [storageKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".notification-dropdown")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative notification-dropdown">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setNotifying(false);
        }}
        className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        <span
          className={`absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1 ${
            notifying ? "inline" : "hidden"
          }`}
        >
          <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
        </span>

        <svg
          className="fill-current duration-300 ease-in-out"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C5.33428 1.96865 3.05615 4.55615 3.05615 7.67803V13.528C3.05615 13.7249 2.9999 13.8937 2.8874 14.0624L2.3249 14.9343C2.24053 15.0468 2.2124 15.1593 2.2124 15.2718C2.2124 15.5812 2.46553 15.8343 2.80303 15.8343H15.1874C15.553 15.8343 15.8343 15.553 15.8343 15.1874C15.8343 15.0749 15.8062 14.9905 15.7218 14.9343H16.1999ZM9.84365 17.5218C10.5468 17.5218 11.1374 16.9312 11.1374 16.228H6.8624C6.8624 16.9312 7.45303 17.5218 8.15615 17.5218H9.84365Z"
            fill=""
          />
        </svg>
      </button>

      {isOpen && (
        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80"
        >
          <div className="px-4.5 py-3">
            <h5 className="text-sm font-medium text-bodydark2">Notification</h5>
          </div>

          <ul className="flex h-auto flex-col overflow-y-auto">
            {notifications.map((item, index) => (
              <li key={index}>
                <Link
                  className="flex flex-col gap-2.5 border-t border-stroke px-4.5 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                  to="#"
                >
                  <p className="text-sm">
                    <span className="text-black dark:text-white">
                      {item.Title}
                    </span>{" "}
                    {item.Message}
                  </p>
                  <p className="text-xs">{new Date(item.CreatedAt).toLocaleString()}</p>
                </Link>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-4.5 py-3 text-center text-sm text-gray-500">
                No notifications
              </li>
            )}
          </ul>
        </Dropdown>
      )}
    </div>
  );
}

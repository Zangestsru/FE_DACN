"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

// A reusable DatePicker that supports controlled usage
// Props align with how RegisterForm expects to pass and receive the selected date.
export default function DatePicker({
  date,
  onDateChange,
  placeholder = "Chọn ngày",
  className,
  showClear = true,
}: {
  date?: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
}) {
  // Keep internal state synced with the external value
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(date);

  React.useEffect(() => {
    setInternalDate(date);
  }, [date]);

  const handleSelect = (d?: Date) => {
    setInternalDate(d);
    onDateChange?.(d);
  };

  const handleReset = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setInternalDate(undefined);
    onDateChange?.(undefined);
  };

  return (
    <Popover>
      <div className={"relative w-full " + (className ?? "")}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
            {/* Calendar icon kept for clarity; if you prefer no icon, we can remove it upon request */}
            <CalendarIcon className="me-2 h-4 w-4" />
            {internalDate ? (
              format(internalDate, "PPP")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        {showClear && internalDate && (
          <Button
            type="button"
            variant="dim"
            size="sm"
            className="absolute top-1/2 -end-0 -translate-y-1/2"
            onClick={handleReset}
            aria-label="Clear date"
          >
            <X />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={internalDate} onSelect={handleSelect} autoFocus />
      </PopoverContent>
    </Popover>
  );
}
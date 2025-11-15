import { ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  pageLength?: number;
  pagingBtnClasses?: string;
};

export default function FlyonDataTableWrapper({ children, pageLength = 10, pagingBtnClasses = "rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const $: any = (await import("jquery")).default;
        await import("datatables.net");
        try { await import("datatables.net-fixedheader"); } catch {}
        const table = ref.current?.querySelector("table");
        if (!table) return;
        const dt = $(table).DataTable({ pageLength, fixedHeader: true });
        const container = ref.current;
        const stylePaging = () => {
          if (!container) return;
          $(container).find(".dt-paging button").addClass(pagingBtnClasses);
        };
        stylePaging();
        $(table).on("draw.dt", stylePaging);
      } catch {}
    })();
  }, [pageLength, pagingBtnClasses]);

  const dataOptions = JSON.stringify({ pageLength, pagingOptions: { pageBtnClasses: pagingBtnClasses } });

  return (
    <div ref={ref} className="bg-base-100 flex flex-col rounded-md shadow-base-300/20 shadow-sm" data-datatable={dataOptions}>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">{children}</div>
        </div>
      </div>
      <div className="border-base-content/25 flex items-center justify-between gap-3 border-t p-3 max-md:flex-wrap max-md:justify-center">
        <div className="text-base-content/80 text-sm" data-datatable-info="">
          Showing <span data-datatable-info-from="1"></span> to <span data-datatable-info-to="10"></span> of <span data-datatable-info-length="0"></span>
        </div>
        <div className="flex hidden items-center space-x-1" data-datatable-paging="">
          <button type="button" className={pagingBtnClasses} data-datatable-paging-prev="">
            <span className="icon-[tabler--chevrons-left] size-4.5 rtl:rotate-180"></span>
            <span className="sr-only">Previous</span>
          </button>
          <div className="[&>.active]:text-bg-soft-primary flex items-center space-x-1" data-datatable-paging-pages=""></div>
          <button type="button" className={pagingBtnClasses} data-datatable-paging-next="">
            <span className="sr-only">Next</span>
            <span className="icon-[tabler--chevrons-right] size-4.5 rtl:rotate-180"></span>
          </button>
        </div>
      </div>
    </div>
  );
}

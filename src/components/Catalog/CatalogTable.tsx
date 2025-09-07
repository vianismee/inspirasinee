"use client";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import React from "react";
import { DataTable } from "../data-table/data-table";
import { DataTableToolbar } from "../data-table/data-table-toolbar";
import { parseAsString, useQueryState } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { useDataTable } from "@/hooks/use-data-table";
import { formatedCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";

interface Service {
  id: number;
  name: string;
  amount: number;
}

export function CatalogTable() {
  const [services] = useQueryState("name", parseAsString.withDefault(""));

  const { fetchCatalog, serviceCatalog, subscribeService, deleteService } =
    useServiceCatalogStore();

  React.useEffect(() => {
    fetchCatalog();

    const unsubscribe = subscribeService();
    return () => {
      unsubscribe();
    };
  }, [fetchCatalog, subscribeService]);

  const filteredService = React.useMemo(() => {
    return serviceCatalog.filter((service) => {
      const matchesService =
        services === "" ||
        service.name.toLocaleLowerCase().includes(services.toLocaleLowerCase());

      return matchesService;
    });
  }, [serviceCatalog, services]);

  const columns = React.useMemo<ColumnDef<Service>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Service",
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Harga",
        cell: ({ row }) => (
          <div>{formatedCurrency(row.getValue("amount"))}</div>
        ),
      },
      {
        id: "actions",
        cell: function Cell({ row }) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"} size={"icon"}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600 focus:text-red-800">
                  <button onClick={() => deleteService(row.original.id)}>
                    Delete
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    [deleteService]
  );

  const { table } = useDataTable({
    data: filteredService,
    columns,
    pageCount: 10,
    initialState: {
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.name,
  });

  return (
    <div>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}

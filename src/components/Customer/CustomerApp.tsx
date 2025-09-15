"use client";

import React, { useState, Suspense } from "react";
import { Headers } from "../MainComponent/Header";
import TableSkeleton from "../Dashboard/TableSekeleton";
import { CustomerTable } from "./CustomerTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomerForm from "./CustomerForm";
import { CustomerCard } from "./CustomerCard";
import { ICustomers } from "@/types";

export function CustomerApp() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomers | null>(
    null
  );

  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedCustomer(null);
    }
  };

  const handleCardDialogChange = (open: boolean) => {
    setIsCardOpen(open);
    if (!open) {
      setSelectedCustomer(null);
    }
  };

  const handleEdit = (customer: ICustomers) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleView = (customer: ICustomers) => {
    setSelectedCustomer(customer);
    setIsCardOpen(true);
  };

  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <div className="flex flex-col gap-4">
        <Headers title="Pelanggan" desc="Kelola daftar semua pelanggan." />
        <Suspense fallback={<TableSkeleton />}>
          <CustomerTable onEdit={handleEdit} onView={handleView} />

          {/* Dialog untuk Edit */}
          <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Pelanggan</DialogTitle>
              </DialogHeader>
              <CustomerForm
                onFormSuccess={() => handleFormDialogChange(false)}
                initialData={selectedCustomer}
              />
            </DialogContent>
          </Dialog>

          {/* Dialog untuk View Card */}
          <Dialog open={isCardOpen} onOpenChange={handleCardDialogChange}>
            <DialogContent className="sm:max-w-sm p-0">
              {selectedCustomer && <CustomerCard customer={selectedCustomer} />}
            </DialogContent>
          </Dialog>
        </Suspense>
      </div>
    </div>
  );
}

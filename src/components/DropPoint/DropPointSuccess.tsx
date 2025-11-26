"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Package,
  Eye,
} from "lucide-react";

interface AssignedShelf {
  item_number: number;
  shelf_number: string;
  shoe_name: string;
}

export function DropPointSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const [assignedShelves, setAssignedShelves] = useState<AssignedShelf[]>([]);

  useEffect(() => {
    if (!invoiceId) {
      router.push("/drop-point");
    }

    const storedShelves = localStorage.getItem("assigned_shelves");
    if (storedShelves) {
      try {
        setAssignedShelves(JSON.parse(storedShelves));
      } catch (e) {
        console.error("Failed to parse assigned shelves", e);
      }
    } else {
      // DUMMY DATA FOR UI PREVIEW (When accessing page directly or no localStorage)
      setAssignedShelves([
        {
          item_number: 1,
          shelf_number: "A-05",
          shoe_name: "Nike Air Force 1 (Preview)",
        },
        {
          item_number: 2,
          shelf_number: "C-12",
          shoe_name: "Adidas Ultraboost (Preview)",
        },
      ]);
    }
  }, [invoiceId, router]);

  const handleNewOrder = () => {
    router.push("/drop-point");
  };

  const handleViewMyItems = () => {
    router.push("/my-items");
  };

  return (
    <div className="min-h-screen bg-green-50 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-green-100">
          {/* Header */}
          <div className="bg-gradient-to-b from-green-50 to-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 shadow-sm animate-in zoom-in duration-300">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-500">Thank you for your order.</p>
            {invoiceId && (
              <div className="mt-4 inline-block bg-gray-50 px-4 py-1.5 rounded-full text-sm font-mono text-gray-600 border border-gray-200">
                #{invoiceId}
              </div>
            )}
          </div>

          <div className="p-8 pt-0">
            {/* Shelf Assignments - MAIN FOCUS */}
            {assignedShelves.length > 0 && (
              <div className="mb-8">
                <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-50"></div>

                  <h2 className="relative z-10 text-lg font-medium text-blue-100 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" /> Taruh Sepatu sesuai dengan
                    Kode Rak:
                  </h2>

                  <div className="relative z-10 space-y-3">
                    {assignedShelves.map((shelf, idx: number) => (
                      <div
                        key={`${shelf.item_number}-${idx}`}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center border border-white/20"
                      >
                        <div>
                          <span className="block text-xs text-blue-200 uppercase tracking-wider font-bold">
                            Item #{shelf.item_number || idx + 1}
                          </span>
                          <span className="text-sm text-white font-medium">
                            {shelf.shoe_name || "Shoe"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs text-blue-200 uppercase tracking-wider font-bold mb-1">
                            KODE RAK
                          </span>
                          <span className="text-4xl font-black text-white tracking-tight leading-none">
                            {shelf.shelf_number}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-sm text-gray-400 mt-3">
                  Pastikan lagi bahwa sepatumu masuk ke dalam rak yang sesuai.
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-gray-900 text-lg">What&apos;s Next?</h3>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Place Items</p>
                  <p className="text-sm text-gray-500">
                    Put your shoes in the assigned racks above.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">We Clean</p>
                  <p className="text-sm text-gray-500">
                    Our experts will take care of your shoes. You can track your
                    order by Invoice #{invoiceId}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">You Collect</p>
                  <p className="text-sm text-gray-500">
                    We&apos;ll WhatsApp you when they are ready!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleViewMyItems}
                className="w-full h-14 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl flex items-center justify-center gap-2"
              >
                <Eye className="h-5 w-5" />
                View My Items
              </Button>
              <Button
                onClick={handleNewOrder}
                className="w-full h-14 text-lg rounded-xl bg-gray-900 hover:bg-gray-800 shadow-xl"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

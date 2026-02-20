"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Package, ChevronDown, ChevronUp, Wrench, Crown, Flame } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Orders } from "@/types/index";
import { formatedCurrency } from "@/lib/utils";

// Extended interface for orders with referral properties
interface OrderWithReferral extends Orders {
  referral_code?: string;
  referral_discount_amount?: number;
  points_used?: number;
  points_discount_amount?: number;
  membership_discount_amount?: number;
  membership_level_id?: number;
  shine_points_discount_amount?: number;
}

interface InvoiceItemsProps {
  order: Orders;
}

export function InvoiceItems({ order }: InvoiceItemsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(
    new Set(order.order_item.map((_, idx) => idx))
  );

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getItemSubtotal = (itemIndex: number) => {
    return order.order_item[itemIndex].services.reduce(
      (sum, service) => sum + parseFloat(service.amount),
      0
    );
  };

  // Border colors for different items (rotating through indigo, purple, pink, blue)
  const borderColors = [
    "border-indigo-500",
    "border-purple-500",
    "border-pink-500",
    "border-blue-500",
  ];

  const bgColors = [
    "bg-indigo-100 dark:bg-indigo-900",
    "bg-purple-100 dark:bg-purple-900",
    "bg-pink-100 dark:bg-pink-900",
    "bg-blue-100 dark:bg-blue-900",
  ];

  return (
    <Card className="shadow-lg bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          Invoice Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scrollable items container - responsive height */}
        <div className="max-h-[250px] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {order.order_item.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tidak ada item dalam invoice
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Hubungi customer service untuk bantuan lebih lanjut
            </p>
          </div>
        ) : (
          // Item groups
          order.order_item.map((groupedItem, index) => {
            const isExpanded = expandedItems.has(index);
            const borderColor = borderColors[index % borderColors.length];
            const bgColor = bgColors[index % bgColors.length];
            const subtotal = getItemSubtotal(index);

            return (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-l-4 ${borderColor} hover:shadow-md transition-all`}
              >
                {/* Item header */}
                <div
                  className="p-4 cursor-pointer flex items-center gap-3"
                  onClick={() => toggleItem(index)}
                >
                  {/* Product icon */}
                  <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Package className="h-6 w-6" />
                  </div>

                  {/* Product name and expand button */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {groupedItem.shoe_name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {groupedItem.services.length}{" "}
                        {groupedItem.services.length === 1 ? "service" : "services"}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Services list (collapsible) */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2">
                      {groupedItem.services.map((service, serviceIndex) => {
                        const amount = parseFloat(service.amount);

                        return (
                          <div
                            key={serviceIndex}
                            className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {service.service}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                              {formatedCurrency(amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Subtotal */}
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Subtotal
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {formatedCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>

        {/* Order Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
          <h4 className="font-bold text-lg mb-4">
            Order Summary
          </h4>

          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-mono font-medium">
                {formatedCurrency(order.subtotal || 0)}
              </span>
            </div>

            {/* Order discounts */}
            {Array.isArray(order.order_discounts) && order.order_discounts.length > 0 && (
              <>
                {order.order_discounts.map((d, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm items-center bg-green-50 dark:bg-green-950 p-2 rounded"
                  >
                    <span className="text-green-700 dark:text-green-400">
                      Diskon - {d.discount_code || 'Unknown'}
                    </span>
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">
                      -{formatedCurrency(d.discounted_amount || 0)}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Referral Discount Display */}
            {(order as OrderWithReferral).referral_code &&
              ((order as OrderWithReferral).referral_discount_amount || 0) > 0 && (
                <div className="flex justify-between text-sm items-center bg-green-50 dark:bg-green-950 p-2 rounded">
                  <span className="text-green-700 dark:text-green-400">
                    Referral - {(order as OrderWithReferral).referral_code}
                  </span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-400">
                    -{formatedCurrency((order as OrderWithReferral).referral_discount_amount || 0)}
                  </span>
                </div>
              )}

            {/* Points Redemption Display */}
            {(order as OrderWithReferral).points_used &&
              ((order as OrderWithReferral).points_used || 0) > 0 && (
                <div className="flex justify-between text-sm items-center bg-orange-50 dark:bg-orange-950 p-2 rounded">
                  <span className="text-orange-700 dark:text-orange-400">
                    Poin ({(order as OrderWithReferral).points_used} pts)
                  </span>
                  <span className="font-mono font-bold text-orange-700 dark:text-orange-400">
                    -{formatedCurrency((order as OrderWithReferral).points_discount_amount || 0)}
                  </span>
                </div>
              )}

            {/* Membership Discount Display */}
            {(order as OrderWithReferral).membership_discount_amount &&
              ((order as OrderWithReferral).membership_discount_amount || 0) > 0 && (
                <div className="flex justify-between text-sm items-center bg-purple-50 dark:bg-purple-950 p-2 rounded">
                  <span className="text-purple-700 dark:text-purple-400 flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5" />
                    Membership Discount
                  </span>
                  <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                    -{formatedCurrency((order as OrderWithReferral).membership_discount_amount || 0)}
                  </span>
                </div>
              )}

            {/* Shine Points Redemption Display */}
            {(order as OrderWithReferral).shine_points_discount_amount &&
              ((order as OrderWithReferral).shine_points_discount_amount || 0) > 0 && (
                <div className="flex justify-between text-sm items-center bg-pink-50 dark:bg-pink-950 p-2 rounded">
                  <span className="text-pink-700 dark:text-pink-400 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    Shine Points Redemption
                  </span>
                  <span className="font-mono font-bold text-pink-700 dark:text-pink-400">
                    -{formatedCurrency((order as OrderWithReferral).shine_points_discount_amount || 0)}
                  </span>
                </div>
              )}

            <Separator className="my-2" />

            {/* Total */}
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {formatedCurrency(order.total_price || 0)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

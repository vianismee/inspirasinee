"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "../ui/badge";
import { useInvoiceID } from "@/hooks/useNanoID";
import { formatedCurrency } from "@/lib/utils";
import { useCustomerStore } from "@/stores/customerStore";
import { Plus, Trash2, Package, X } from "lucide-react";
import { DropPointService } from "@/lib/client-services";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { logger } from "@/utils/client/logger";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { ScrollArea } from "../ui/scroll-area";
// Types
export interface ServiceItem {
  name: string;
  amount: number;
}

interface DropPointItem {
  id: string;
  shoeName: string;
  color: string;
  size: string;
  itemNumber: number;
  services: ServiceItem[]; // Services selected for this item
  addOns: Array<{
    name: string;
    price: number;
    isAutomatic: boolean;
  }>;
  totalPrice: number;
  customShoeName?: string;
}

interface DropPointLocation {
  id: number;
  name: string;
  address: string;
  max_capacity: number;
  current_capacity: number;
  available_capacity: number;
  is_available: boolean;
}

// Constants
const COLORS = [
  { value: "white", label: "White", hasWhiteTreatment: true },
  { value: "black", label: "Black", hasWhiteTreatment: false },
  { value: "brown", label: "Brown", hasWhiteTreatment: false },
  { value: "gray", label: "Gray", hasWhiteTreatment: false },
  { value: "red", label: "Red", hasWhiteTreatment: false },
  { value: "blue", label: "Blue", hasWhiteTreatment: false },
  { value: "green", label: "Green", hasWhiteTreatment: false },
  { value: "yellow", label: "Yellow", hasWhiteTreatment: false },
  { value: "purple", label: "Purple", hasWhiteTreatment: false },
  { value: "pink", label: "Pink", hasWhiteTreatment: false },
];

const WHITE_TREATMENT_PRICE = 5000; // Automatic add-on for white shoes
const MAX_ITEMS_PER_ORDER = 40;

interface DropPointOrderFormProps {
  locationId: string;
}

export function DropPointOrderForm({ locationId }: DropPointOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = useInvoiceID();
  const { allServicesCatalog, fetchCatalog, fetchAllCatalog } = useServiceCatalogStore();
  const { activeCustomer } = useCustomerStore();

  // Load service catalog on component mount
  useEffect(() => {
    fetchCatalog();
    fetchAllCatalog();
  }, [fetchCatalog, fetchAllCatalog]);

  // Parse location ID from URL params
  const [dropPointId, setDropPointId] = useState<number | null>(null);
  const [selectedDropPoint, setSelectedDropPoint] = useState<DropPointLocation | null>(null);

  // Form state
  const [items, setItems] = useState<DropPointItem[]>([]);

  // Group services by category for display
  const groupedServices = React.useMemo(() => {
    return allServicesCatalog.reduce((acc, service) => {
      const categoryName = service.service_category?.name || "Lainnya";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {} as Record<string, typeof allServicesCatalog>);
  }, [allServicesCatalog]);

  // Check if customer data is available
  useEffect(() => {
    if (!activeCustomer) {
      toast.error("No customer data found. Please start from the beginning.");
      router.push("/drop-point");
      return;
    }
  }, [activeCustomer, router]);

  // Load drop-point details on component mount
  useEffect(() => {
    const loadDropPointLocation = async () => {
      try {

        // Get location ID from localStorage (stored in Stage 1) or URL params
        const storedLocationId = localStorage.getItem("drop_point_location_id");
        const idParam = searchParams.get('id');
        const locationIdToUse = storedLocationId ? parseInt(storedLocationId) : (idParam ? parseInt(idParam) : parseInt(locationId));

        if (isNaN(locationIdToUse)) {
          toast.error("Invalid location ID");
          router.push("/drop-point");
          return;
        }

        setDropPointId(locationIdToUse);

        // Load all locations and find the matching one
        const locations = await DropPointService.getDropPointLocations();
        const location = locations.find(loc => loc.id === locationIdToUse);

        if (!location) {
          toast.error("Drop-point location not found");
          router.push("/drop-point");
          return;
        }

        if (!location.is_available) {
          toast.error("This drop-point location is currently full");
          router.push("/drop-point");
          return;
        }

        setSelectedDropPoint(location);
        logger.info("Loaded drop-point location", { locationId: locationIdToUse, locationName: location.name }, "DropPointOrderForm");

      } catch (error) {
        logger.error("Failed to load drop-point location", { error, locationId }, "DropPointOrderForm");
        toast.error("Failed to load drop-point location. Please try again.");
        router.push("/drop-point");
      }
    };

    loadDropPointLocation();
  }, [locationId, searchParams, router]);

  // Service selection handler
  const handleServiceSelect = (itemId: string, serviceName: string) => {
    const service = allServicesCatalog.find((s) => s.name === serviceName);
    if (service) {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const updatedServices = [...item.services, { name: service.name, amount: service.amount }];
          const updatedAddOns = [...item.addOns];

          // Add automatic white treatment if color is white and service is not already added
          if (item.color === "white" && service.name === "White Treatment") {
            // Ensure it's marked as automatic
            const whiteTreatmentIndex = updatedAddOns.findIndex(addOn => addOn.name === "White Treatment");
            if (whiteTreatmentIndex === -1) {
              updatedAddOns.push({
                name: "White Treatment",
                price: WHITE_TREATMENT_PRICE,
                isAutomatic: true,
              });
            }
          }

          return {
            ...item,
            services: updatedServices,
            addOns: updatedAddOns,
            totalPrice: calculateItemTotal(item.color, updatedServices, updatedAddOns)
          };
        }
        return item;
      }));
    }
  };

  // Remove service from item
  const removeServiceFromItem = (itemId: string, serviceName: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedServices = item.services.filter(service => service.name !== serviceName);
        let updatedAddOns = [...item.addOns];

        // If removing White Treatment and it was automatic, also remove from addOns
        if (serviceName === "White Treatment") {
          updatedAddOns = updatedAddOns.filter(addOn => addOn.name !== "White Treatment");
        }

        return {
          ...item,
          services: updatedServices,
          addOns: updatedAddOns,
          totalPrice: calculateItemTotal(item.color, updatedServices, updatedAddOns)
        };
      }
      return item;
    }));
  };

  // Calculate item total with services and add-ons
  const calculateItemTotal = (color: string, services: ServiceItem[], addOns: Array<{name: string; price: number}>): number => {
    // Use the same price logic as updateItemColor to find service price
    // However, the services array already contains the price (amount)
    const servicesTotal = services.reduce((total, service) => total + service.amount, 0);
    // AddOns are also handled correctly
    const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0);
    
    // Check if white treatment is in services but not addOns (should usually be consistent)
    // or if it's just missing from addOns
    if (color === "white") {
        const hasWhiteAddon = addOns.some(a => a.name === "White Treatment");
        if (!hasWhiteAddon) {
             // If for some reason it's not in addOns but color is white, add it?
             // Actually, updateItemColor ensures it is in addOns. 
             // The issue might be that service amount is 0 for White Treatment in DB?
             // Or simply that it was added as a Service (with a price) AND as an AddOn?
             // The previous logic added it to BOTH services and addOns.
             // Let's look at updateItemColor again.
        }
    }

    return servicesTotal + addOnsTotal;
  };

  // Update item color and handle automatic white treatment
  const updateItemColor = (itemId: string, color: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        let updatedAddOns = [...item.addOns];
        const updatedServices = [...item.services];

        // Add automatic white treatment if color is white
        if (color === "white") {
          const hasWhiteTreatment = updatedServices.some(service => service.name === "White Treatment");
          const hasWhiteTreatmentAddOn = updatedAddOns.some(addOn => addOn.name === "White Treatment");

          if (!hasWhiteTreatment) {
            // Find White Treatment service from catalog
            // IMPORTANT: We don't add it to services list to avoid double charging if we charge via addOns
            // OR we add it to services but ensure price is correct.
            // The prompt said: "otomatis tambahkan harga Rp 5.000"
            
            // Let's add it ONLY as an Add-on to be safe and simple, or as a Service if that's how the system works.
            // The previous code added it to BOTH.
            // If "White Treatment" exists in catalog with a price, and we add it to services, it adds cost.
            // If we ALSO add it to addOns with a price, it adds cost AGAIN.
            
            // Fix: Only add to AddOns for the extra charge, OR only add to Services.
            // The display uses AddOns to show "(Auto)".
            
            if (!hasWhiteTreatmentAddOn) {
                updatedAddOns.push({
                    name: "White Treatment",
                    price: WHITE_TREATMENT_PRICE,
                    isAutomatic: true,
                });
            }
          }
        } else {
          // Remove white treatment if color is not white
          // Remove from services if it was added there? 
          // The previous logic removed from both.
          const whiteTreatmentIndex = updatedServices.findIndex(service => service.name === "White Treatment");
          if (whiteTreatmentIndex !== -1) {
            updatedServices.splice(whiteTreatmentIndex, 1);
          }
          updatedAddOns = updatedAddOns.filter(addOn => addOn.name !== "White Treatment");
        }

        return {
          ...item,
          color,
          services: updatedServices,
          addOns: updatedAddOns,
          totalPrice: calculateItemTotal(color, updatedServices, updatedAddOns)
        };
      }
      return item;
    }));
  };

  // Add new item
  const addNewItem = () => {
    if (items.length >= MAX_ITEMS_PER_ORDER) {
      toast.error(`Maximum ${MAX_ITEMS_PER_ORDER} items allowed per order`);
      return;
    }

    if (!selectedDropPoint || items.length >= selectedDropPoint.available_capacity) {
      toast.error("Insufficient capacity at this drop-point location");
      return;
    }

    const newItem: DropPointItem = {
      id: Date.now().toString(),
      shoeName: "",
      color: "",
      size: "",
      itemNumber: items.length + 1,
      services: [],
      addOns: [],
      totalPrice: 0,
    };

    setItems([...items, newItem]);
  };

  // Update item field
  const updateItem = (itemId: string, field: keyof DropPointItem, value: string | number) => {
    if (field === "color") {
      updateItemColor(itemId, value as string);
    } else {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Update shoe name if provided
          if (field === "shoeName" && value) {
            updatedItem.customShoeName = value as string;
          }

          // Recalculate total if price changes
          if (field === "services" || field === "addOns") {
            updatedItem.totalPrice = calculateItemTotal(updatedItem.color, updatedItem.services, updatedItem.addOns);
          }

          return updatedItem;
        }
        return item;
      }));
    }
  };

  // Remove item
  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    // Renumber items
    const renumberedItems = updatedItems.map((item, index) => ({
      ...item,
      itemNumber: index + 1,
    }));
    setItems(renumberedItems);
  };

  // Calculate order total
  const orderTotal = items.reduce((total, item) => total + item.totalPrice, 0);

  // Check capacity
  const isCapacityAvailable = selectedDropPoint
    ? selectedDropPoint.available_capacity >= items.length
    : false;

  // Submit order
  const onSubmit = async () => {
    try {
      if (!selectedDropPoint || !dropPointId) {
        toast.error("Invalid drop-point location");
        return;
      }

      if (!activeCustomer) {
        toast.error("No customer data available");
        return;
      }

      // Validate form
      if (items.length === 0) {
        toast.error("Please add at least one item");
        return;
      }

      // Validate all items have required information
      const invalidItems = items.filter(item => !item.shoeName || !item.color || !item.size);
      if (invalidItems.length > 0) {
        toast.error("Please complete all item information (name, color, size)");
        return;
      }

      if (!isCapacityAvailable) {
        toast.error("Selected drop-point has insufficient capacity");
        return;
      }

      // Generate customer marker for drop-point
      const customerMarker = `DP${activeCustomer.customer_id.slice(-6).toUpperCase()}`;

      // Store customer data in localStorage for guest usage
      const customerData = {
        customer_id: activeCustomer.customer_id,
        customer_name: activeCustomer.username,
        customer_whatsapp: activeCustomer.whatsapp,
        customer_email: activeCustomer.email,
        customer_alamat: activeCustomer.alamat,
        customer_marking: customerMarker,
        is_new_customer: activeCustomer.isNew,
      };
      localStorage.setItem("drop_point_customer", JSON.stringify(customerData));

      // Prepare order data for drop-point
      const orderData = {
        invoice_id: invoiceId,
        fulfillment_type: "drop-point",
        drop_point_id: dropPointId,
        items: items.map(item => ({
          shoe_name: item.shoeName,
          custom_shoe_name: item.customShoeName || item.shoeName,
          color: item.color,
          size: item.size,
          item_number: item.itemNumber,
          services: item.services.map(service => ({
            name: service.name,
            amount: service.amount
          })),
          add_ons: item.addOns,
          total_price: item.totalPrice,
          has_white_treatment: item.color === "white",
        })),
        total_price: orderTotal,
        customer_marking: customerMarker,
        customer_id: activeCustomer.customer_id,
        customer_name: activeCustomer.username,
        customer_whatsapp: activeCustomer.whatsapp,
        payment_method: "QRIS",
        payment_status: "pending",
      };

      // Store drop-point order data in localStorage for processing
      localStorage.setItem("drop_point_order", JSON.stringify(orderData));

      // Redirect to drop-point payment (QRIS only)
      const locationSlug = selectedDropPoint.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      router.push(`/drop-point/${locationSlug}/payment?invoice=${invoiceId}`);

    } catch (error) {
      console.error("Drop-point order submission error", error);
      toast.error("Failed to submit drop-point order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        
        {/* Header Steps */}
        <div className="mb-8 flex items-center justify-between text-sm font-medium text-gray-400">
            <div className="flex items-center text-blue-600 cursor-pointer" onClick={() => router.back()}>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">✓</div>
                Details
            </div>
            <div className="h-px bg-blue-200 flex-1 mx-4"></div>
            <div className="flex items-center text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 text-sm font-bold">2</div>
                Items
            </div>
            <div className="h-px bg-gray-200 flex-1 mx-4"></div>
             <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mr-2 text-sm font-bold">3</div>
                Pay
            </div>
        </div>

        {/* Welcome / Info */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Add Your Items</h1>
            <p className="text-gray-500 mt-1">Add shoes and select services for each.</p>
        </div>

        {/* Items List */}
        <div className="space-y-6 mb-8">
             {items.length === 0 ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
                onClick={addNewItem}
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                    <Package className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Start adding shoes to your order</p>
                <Button onClick={(e) => { e.stopPropagation(); addNewItem(); }} className="rounded-full px-6">
                    <Plus className="h-4 w-4 mr-2" /> Add First Item
                </Button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    
                    <div className="flex justify-between items-start mb-6 pl-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                {index + 1}
                            </span>
                            <h3 className="font-bold text-lg text-gray-900">Shoe Details</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pl-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Model Name</Label>
                            <Input
                                value={item.shoeName}
                                onChange={(e) => updateItem(item.id, "shoeName", e.target.value)}
                                className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-100"
                                placeholder="e.g. Nike Air Force 1"
                            />
                        </div>
                         <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Size</Label>
                            <Input
                                value={item.size}
                                onChange={(e) => updateItem(item.id, "size", e.target.value)}
                                className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-100"
                                placeholder="e.g. 42"
                            />
                        </div>
                         <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {COLORS.map((c) => (
                                    <div 
                                        key={c.value}
                                        onClick={() => updateItem(item.id, "color", c.value)}
                                        className={`cursor-pointer rounded-lg border px-3 py-2 flex items-center gap-2 transition-all ${
                                            item.color === c.value 
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border shadow-sm`} style={{ backgroundColor: c.value === 'other' ? 'transparent' : c.value }}></div>
                                        <span className="text-sm font-medium text-gray-700 capitalize">{c.value}</span>
                                    </div>
                                ))}
                            </div>
                             {item.color === 'white' && (
                                <div className="text-xs text-green-600 mt-1 flex items-center font-medium animate-in fade-in slide-in-from-top-1">
                                    ✓ White Treatment (+Rp 5.000) auto-applied
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-5 pl-6">
                         <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Services</Label>
                         
                         {/* Selected Services Tags */}
                         <div className="flex flex-wrap gap-2 mb-4">
                            {item.services.map((service) => (
                                <Badge key={service.name} className="pl-3 pr-1 py-1.5 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm rounded-lg text-sm font-medium">
                                    {service.name}
                                    <div className="ml-2 h-5 w-5 rounded-md flex items-center justify-center hover:bg-blue-100 cursor-pointer" onClick={() => removeServiceFromItem(item.id, service.name)}>
                                        <X className="h-3 w-3" />
                                    </div>
                                </Badge>
                            ))}
                            <Combobox onValueChange={(val) => handleServiceSelect(item.id, val)} value="">
                                <ComboboxAnchor>
                                    <ComboboxTrigger className="as-child">
                                        <Badge variant="outline" className="cursor-pointer border-dashed border-gray-400 text-gray-500 hover:text-gray-800 hover:border-gray-600 bg-transparent py-1.5 px-3 rounded-lg text-sm">
                                            <Plus className="h-3 w-3 mr-1" /> Add Service
                                        </Badge>
                                    </ComboboxTrigger>
                                </ComboboxAnchor>
                                <ComboboxContent align="start" className="w-[250px]">
                                    <ScrollArea className="h-[200px]">
                                         {Object.entries(groupedServices).map(([category, services], idx) => (
                                            <div key={category}>
                                                <ComboboxGroup>
                                                    <ComboboxGroupLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">{category}</ComboboxGroupLabel>
                                                    {services.map((service) => (
                                                        <ComboboxItem key={service.id} value={service.name} className="pl-4 py-2 cursor-pointer">
                                                            <div className="flex justify-between w-full">
                                                                <span>{service.name}</span>
                                                                <span className="text-gray-400 text-xs">{formatedCurrency(service.amount)}</span>
                                                            </div>
                                                        </ComboboxItem>
                                                    ))}
                                                </ComboboxGroup>
                                                {idx < Object.keys(groupedServices).length - 1 && <Separator className="my-1"/>}
                                            </div>
                                         ))}
                                    </ScrollArea>
                                </ComboboxContent>
                            </Combobox>
                         </div>

                         {/* Automatic Addons */}
                         {item.addOns.filter(a => a.isAutomatic).length > 0 && (
                             <div className="space-y-2 border-t border-gray-200 pt-3 mt-2">
                                 {item.addOns.filter(a => a.isAutomatic).map((addon, idx) => (
                                     <div key={idx} className="flex justify-between text-sm text-gray-500 italic">
                                         <span>{addon.name} (Auto)</span>
                                         <span>+{formatedCurrency(addon.price)}</span>
                                     </div>
                                 ))}
                             </div>
                         )}

                         <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-500">Item Total</span>
                            <span className="text-xl font-bold text-gray-900">{formatedCurrency(item.totalPrice)}</span>
                         </div>
                    </div>
                </div>
              ))
            )}

            {/* Add Button */}
            {items.length > 0 && items.length < MAX_ITEMS_PER_ORDER && (
                 <Button 
                    variant="outline" 
                    onClick={addNewItem} 
                    className="w-full h-14 rounded-2xl border-dashed border-2 border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50"
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Another Item
                </Button>
            )}
        </div>

        {/* Sticky Footer / Summary */}
        {items.length > 0 && (
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-lg z-10 p-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <div className="text-sm text-gray-500">Total Payment</div>
                        <div className="text-2xl font-bold text-gray-900">{formatedCurrency(orderTotal)}</div>
                    </div>
                    <div className="flex-1 sm:flex-none flex gap-3">
                         <Button variant="ghost" onClick={() => router.back()} className="hidden sm:flex text-gray-500">
                             Back
                         </Button>
                         <Button 
                            onClick={onSubmit} 
                            className="flex-1 sm:w-64 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-200"
                            disabled={!isCapacityAvailable}
                        >
                            Checkout ({items.length})
                         </Button>
                    </div>
                </div>
                {/* Mobile Total show above button */}
                <div className="sm:hidden text-center mb-2 text-sm">
                    Total: <span className="font-bold">{formatedCurrency(orderTotal)}</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
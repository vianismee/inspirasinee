"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { useCustomerID } from "@/hooks/useNanoID";
import { useInvoiceID } from "@/hooks/useNanoID";
import { formatedCurrency } from "@/lib/utils";
import { useCustomerStore } from "@/stores/customerStore";
import { Plus, Trash2, Package, ArrowLeft, ChevronDown, X } from "lucide-react";
import { DropPointService, AddOnService } from "@/lib/client-services";
import { useServiceCatalogStore } from "@/stores/serviceCatalogStore";
import { logger } from "@/utils/client/logger";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
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
  { value: "other", label: "Other", hasWhiteTreatment: false },
];

const BASE_SERVICE_PRICE = 35000; // Base cleaning service price
const WHITE_TREATMENT_PRICE = 15000; // Automatic add-on for white shoes
const MAX_ITEMS_PER_ORDER = 40;

// Form schema for customer information
const customerFormSchema = z.object({
  username: z.string().min(2, { message: "Nama Customer Wajib di Isi" }),
  email: z.string().optional(),
  whatsapp: z.string().min(2, { message: "Nomor WhatsApp Wajib di isi" }),
  alamat: z.string().optional(),
});

interface DropPointOrderFormProps {
  locationId: string;
}

export function DropPointOrderForm({ locationId }: DropPointOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = useCustomerID();
  const invoiceId = useInvoiceID();
  const { allServicesCatalog, fetchCatalog, fetchAllCatalog } = useServiceCatalogStore();
  const { activeCustomer, clearCustomer } = useCustomerStore();

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
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

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
        setIsLoadingLocation(true);

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
      } finally {
        setIsLoadingLocation(false);
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
    const servicesTotal = services.reduce((total, service) => total + service.amount, 0);
    const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0);
    return servicesTotal + addOnsTotal;
  };

  // Update item color and handle automatic white treatment
  const updateItemColor = (itemId: string, color: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedAddOns = [...item.addOns];
        const updatedServices = [...item.services];

        // Add automatic white treatment if color is white
        if (color === "white") {
          const hasWhiteTreatment = updatedServices.some(service => service.name === "White Treatment");
          const hasWhiteTreatmentAddOn = updatedAddOns.some(addOn => addOn.name === "White Treatment");

          if (!hasWhiteTreatment) {
            // Find White Treatment service from catalog
            const whiteTreatmentService = allServicesCatalog.find(service => service.name === "White Treatment");
            if (whiteTreatmentService) {
              updatedServices.push({ name: "White Treatment", amount: whiteTreatmentService.amount });
              updatedAddOns.push({
                name: "White Treatment",
                price: WHITE_TREATMENT_PRICE,
                isAutomatic: true,
              });
            }
          }
        } else {
          // Remove white treatment if color is not white
          const whiteTreatmentIndex = updatedServices.findIndex(service => service.name === "White Treatment");
          if (whiteTreatmentIndex !== -1) {
            updatedServices.splice(whiteTreatmentIndex, 1);
          }
          updatedAddOns.splice(updatedAddOns.findIndex(addOn => addOn.name === "White Treatment"), 1);
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
  const updateItem = (itemId: string, field: keyof DropPointItem, value: any) => {
    if (field === "color") {
      updateItemColor(itemId, value);
    } else {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Update shoe name if provided
          if (field === "shoeName" && value) {
            updatedItem.customShoeName = value;
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

  if (isLoadingLocation) {
    return (
      <section className="w-full flex flex-col bg-zinc-200 h-full">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading drop-point location...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col bg-zinc-200 h-full">
      <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6 mb-20">
        {/* Header with back button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/drop-point")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Locations
              </Button>
              <div className="flex-1">
                <div className="font-bold text-xl">DROP-POINT ORDER</div>
                <div className="text-sm text-gray-600">INVOICE ID: {invoiceId}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Drop-Point Info */}
        {selectedDropPoint && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Drop-Point Location
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{selectedDropPoint.name}</h4>
                  <p className="text-sm text-gray-600">{selectedDropPoint.address}</p>
                </div>
                <Badge variant="default">
                  {selectedDropPoint.available_capacity} available spots
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information Display */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Name:</span>
                <span>{activeCustomer?.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">WhatsApp:</span>
                <span>{activeCustomer?.whatsapp}</span>
              </div>
              {activeCustomer?.email && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <span>{activeCustomer.email}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium">Customer Type:</span>
                <Badge variant={activeCustomer?.isNew ? "secondary" : "default"}>
                  {activeCustomer?.isNew ? "New Customer" : "Existing Customer"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Configuration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Configuration ({items.length}/{MAX_ITEMS_PER_ORDER})
            </CardTitle>
            <Button
              onClick={addNewItem}
              disabled={items.length >= MAX_ITEMS_PER_ORDER || !selectedDropPoint || !isCapacityAvailable}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items added yet</p>
                <p className="text-sm">Click "Add Item" to configure your first item</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 relative"
                >
                  {/* Item Header */}
                  <div className="md:col-span-2 flex justify-between items-start">
                    <h4 className="font-semibold">Item #{item.itemNumber}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Shoe Name */}
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`shoeName-${item.id}`}>Shoe Name/Model</Label>
                    <Input
                      id={`shoeName-${item.id}`}
                      value={item.shoeName}
                      onChange={(e) => updateItem(item.id, "shoeName", e.target.value)}
                      className="border-zinc-300"
                      placeholder="e.g., Nike Air Max 90"
                    />
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <Label htmlFor={`size-${item.id}`}>Size</Label>
                    <Input
                      id={`size-${item.id}`}
                      value={item.size}
                      onChange={(e) => updateItem(item.id, "size", e.target.value)}
                      className="border-zinc-300"
                      placeholder="e.g., 42, 8US, L"
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`color-${item.id}`}>Color</Label>
                    <select
                      id={`color-${item.id}`}
                      value={item.color}
                      onChange={(e) => updateItem(item.id, "color", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select color...</option>
                      {COLORS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                          {color.hasWhiteTreatment && " (includes White Treatment)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Display */}
                  <div className="flex items-end justify-end">
                    <div className="text-right">
                      <Label>Total Price</Label>
                      <p className="font-semibold text-lg">
                        {formatedCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="space-y-4 md:col-span-2">
                    <Label>Services</Label>
                    {/* Display selected services as Badges */}
                    <div className="flex flex-wrap gap-2">
                      {item.services.length > 0 ? (
                        item.services.map((service) => (
                          <Badge
                            key={service.name}
                            variant="secondary"
                            className="py-1 px-2 text-sm"
                          >
                            {service.name}
                            <button
                              onClick={() => removeServiceFromItem(item.id, service.name)}
                              className="ml-2 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500">
                          No services selected yet.
                        </p>
                      )}
                    </div>

                    {/* Service Selection Combobox */}
                    <Combobox
                      onValueChange={(val) => handleServiceSelect(item.id, val)}
                      value=""
                    >
                      <ComboboxAnchor>
                        <ComboboxTrigger>
                          <ComboboxInput
                            placeholder="+ Add service"
                            className="w-full border-zinc-400"
                            readOnly
                          />
                          <ChevronDown className="h-4 w-4" />
                        </ComboboxTrigger>
                      </ComboboxAnchor>
                      <ComboboxContent>
                        <ComboboxEmpty>No services found.</ComboboxEmpty>
                        <ScrollArea className="h-[250px]">
                          {Object.entries(groupedServices).map(
                            ([category, services], index) => (
                              <React.Fragment key={category}>
                                <ComboboxGroup>
                                  <ComboboxGroupLabel>
                                    {category}
                                  </ComboboxGroupLabel>
                                  {services.map((service) => (
                                    <ComboboxItem
                                      key={service.id}
                                      value={service.name}
                                    >
                                      <div className="flex items-center gap-1 justify-between w-full">
                                        <span>{service.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500"> -</span>
                                          <span className="text-sm text-gray-500 font-medium">
                                            {formatedCurrency(service.amount)}
                                          </span>
                                        </div>
                                      </div>
                                    </ComboboxItem>
                                  ))}
                                </ComboboxGroup>
                                {index <
                                  Object.entries(groupedServices).length - 1 && (
                                  <Separator className="my-1" />
                                )}
                              </React.Fragment>
                            )
                          )}
                        </ScrollArea>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  {/* Automatic Add-ons Display */}
                  {item.addOns.length > 0 && (
                    <div className="md:col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-900 mb-1">Automatic Add-ons:</div>
                        {item.addOns.map((addOn, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {addOn.name} (+{formatedCurrency(addOn.price)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items ({items.length})</span>
                  <span>{formatedCurrency(items.reduce((total, item) => total + item.totalPrice, 0))}</span>
                </div>

                {/* Show breakdown by service types */}
                {items.some(item => item.services.length > 0) && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="font-medium">Services Breakdown:</div>
                    {allServicesCatalog.map(service => {
                      const serviceCount = items.reduce((count, item) =>
                        count + item.services.filter(s => s.name === service.name).length, 0
                      );
                      if (serviceCount > 0) {
                        return (
                          <div key={service.id} className="ml-2 text-xs">
                            • {service.name} x{serviceCount} = {formatedCurrency(service.amount * serviceCount)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {items.some(item => item.addOns.length > 0) && (
                  <div className="flex justify-between text-sm">
                    <span>Automatic Add-ons</span>
                    <span>{formatedCurrency(items.reduce((total, item) =>
                      total + item.addOns.reduce((addOnTotal, addOn) => addOnTotal + addOn.price, 0), 0
                    ))}</span>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span>{formatedCurrency(orderTotal)}</span>
                </div>
              </div>

              {selectedDropPoint && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Drop-Point: {selectedDropPoint.name}
                  </div>
                  <div className="text-sm text-blue-700">
                    {selectedDropPoint.address}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    Capacity: {selectedDropPoint.current_capacity + items.length}/{selectedDropPoint.max_capacity}
                    {!isCapacityAvailable && (
                      <span className="text-red-600 font-semibold ml-2">
                        - Insufficient capacity!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={!selectedDropPoint || items.length === 0 || !isCapacityAvailable}
          >
            Proceed to QRIS Payment
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              clearCustomer();
              localStorage.removeItem("drop_point_location_id");
              router.push("/drop-point");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </section>
  );
}
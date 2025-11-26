"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { useCustomerStore } from "@/stores/customerStore";
import { useCustomerID } from "@/hooks/useNanoID";
import { useInvoiceID } from "@/hooks/useNanoID";
import { formatedCurrency } from "@/lib/utils";
import { Plus, Trash2, Package } from "lucide-react";
import { DropPointService, AddOnService } from "@/lib/client-services";
import { logger } from "@/utils/client/logger";

// Types
interface DropPointItem {
  id: string;
  shoeName: string;
  color: string;
  size: string;
  itemNumber: number;
  basePrice: number;
  addOns: Array<{
    name: string;
    price: number;
    isAutomatic: boolean;
  }>;
  totalPrice: number;
}

interface DropPointLocation {
  id: number;
  name: string;
  address: string;
  maxCapacity: number;
  currentCapacity: number;
  isAvailable: boolean;
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

export function DropPointOrderForm() {
  const router = useRouter();
  const prepareCustomer = useCustomerStore((state) => state.prepareCustomer);
  const customerId = useCustomerID();
  const invoiceId = useInvoiceID();

  // Form state
  const [items, setItems] = useState<DropPointItem[]>([]);
  const [selectedDropPoint, setSelectedDropPoint] = useState<DropPointLocation | null>(null);
  const [dropPointLocations, setDropPointLocations] = useState<DropPointLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  // Load drop-point locations on component mount
  useEffect(() => {
    const loadDropPointLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const locations = await DropPointService.getDropPointLocations();
        logger.info("Loaded drop-point locations", { count: locations.length }, "DropPointOrderForm");
        setDropPointLocations(locations);
      } catch (error) {
        logger.error("Failed to load drop-point locations", { error }, "DropPointOrderForm");
        toast.error("Failed to load drop-point locations. Please refresh the page.");
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadDropPointLocations();
  }, []);

  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      whatsapp: "",
      alamat: "",
    },
  });

  // Calculate totals
  const calculateItemPrice = (color: string): number => {
    const price = BASE_SERVICE_PRICE;
    if (color === "white") {
      return price + WHITE_TREATMENT_PRICE;
    }
    return price;
  };

  const getAddOnsForColor = (color: string) => {
    const addOns = [];
    if (color === "white") {
      addOns.push({
        name: "White Treatment",
        price: WHITE_TREATMENT_PRICE,
        isAutomatic: true,
      });
    }
    return addOns;
  };

  // Add new item
  const addNewItem = () => {
    if (items.length >= MAX_ITEMS_PER_ORDER) {
      toast.error(`Maximum ${MAX_ITEMS_PER_ORDER} items allowed per order`);
      return;
    }

    const newItem: DropPointItem = {
      id: Date.now().toString(),
      shoeName: "",
      color: "",
      size: "",
      itemNumber: items.length + 1,
      basePrice: BASE_SERVICE_PRICE,
      addOns: [],
      totalPrice: BASE_SERVICE_PRICE,
    };

    setItems([...items, newItem]);
  };

  // Update item field
  const updateItem = (itemId: string, field: keyof DropPointItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };

        // Recalculate price and add-ons when color changes
        if (field === "color") {
          updatedItem.addOns = getAddOnsForColor(value as string);
          updatedItem.totalPrice = calculateItemPrice(value as string);
        }

        
        return updatedItem;
      }
      return item;
    }));
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
    ? selectedDropPoint.currentCapacity + items.length <= selectedDropPoint.maxCapacity
    : false;

  // Submit order
  const onSubmit = async (customerValues: z.infer<typeof customerFormSchema>) => {
    try {
      // Validate form
      if (!selectedDropPoint) {
        toast.error("Please select a drop-point location");
        return;
      }

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

      // Prepare customer data
      const customerData = {
        customer_id: customerId,
        ...customerValues,
        customer_marking: `DP${customerId.slice(-6).toUpperCase()}`, // Customer marker for drop-point
      };

      await prepareCustomer(customerData);

      // Prepare order data for drop-point
      const orderData = {
        invoice_id: invoiceId,
        fulfillment_type: "drop-point",
        drop_point_id: selectedDropPoint.id,
        items: items.map(item => ({
          shoe_name: item.shoeName,
          custom_shoe_name: item.shoeName,
          color: item.color,
          size: item.size,
          item_number: item.itemNumber,
          base_price: item.basePrice,
          add_ons: item.addOns,
          total_price: item.totalPrice,
          has_white_treatment: item.color === "white",
        })),
        total_price: orderTotal,
        customer_marking: customerData.customer_marking,
      };

      // Store drop-point order data in localStorage for processing
      localStorage.setItem("drop_point_order", JSON.stringify(orderData));

      // Redirect to drop-point payment (QRIS only)
      router.push(`/admin/drop-point/payment?invoice=${invoiceId}`);

    } catch (error) {
      console.error("Drop-point order submission error", error);
      toast.error("Failed to submit drop-point order. Please try again.");
    }
  };

  return (
    <section className="w-full flex flex-col bg-zinc-200 h-full">
      <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6 mb-20">
        {/* Invoice Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="font-bold text-xl">DROP-POINT ORDER</div>
            <div className="text-sm text-gray-600">INVOICE ID: {invoiceId}</div>
          </CardContent>
        </Card>

        {/* Customer Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <Form {...customerForm}>
              <form className="space-y-4">
                <FormField
                  control={customerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Customer</FormLabel>
                      <FormControl>
                        <Input
                          className="border border-zinc-400"
                          placeholder="John Doe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={customerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          className="border-zinc-400"
                          placeholder="example@mail.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>(Opsional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={customerForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl className="w-full">
                        <PhoneInput
                          className="border-zinc-400"
                          placeholder="085-XXXX-XXXX"
                          {...field}
                          defaultCountry="ID"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Drop-Point Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Drop-Point Location</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {isLoadingLocations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Loading drop-point locations...</span>
              </div>
            ) : dropPointLocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No drop-point locations available</p>
                <p className="text-sm">Please contact support for assistance</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dropPointLocations.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDropPoint?.id === location.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  } ${!location.isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => location.isAvailable && setSelectedDropPoint(location)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{location.name}</h4>
                      <p className="text-sm text-gray-600">{location.address}</p>
                      <div className="mt-2">
                        <Badge variant={location.isAvailable ? "default" : "secondary"}>
                          {location.currentCapacity}/{location.maxCapacity} items
                        </Badge>
                        <span className="ml-2 text-sm text-gray-500">
                          ({location.maxCapacity - location.currentCapacity} available)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
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
              disabled={items.length >= MAX_ITEMS_PER_ORDER || !selectedDropPoint}
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
                <p className="text-sm">Click &quot;Add Item&quot; to configure your first item</p>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Shoe Name */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Shoe Name/Model</label>
                        <Input
                          value={item.shoeName}
                          onChange={(e) => updateItem(item.id, "shoeName", e.target.value)}
                          placeholder="e.g., Nike Air Max 90"
                        />
                      </div>

                      {/* Size */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Size</label>
                        <Input
                          value={item.size}
                          onChange={(e) => updateItem(item.id, "size", e.target.value)}
                          placeholder="e.g., 42, 8US, L"
                        />
                      </div>

                      {/* Color */}
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Color</label>
                        <select
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
                    </div>

                    {/* Add-ons Display */}
                    {item.addOns.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-1">Automatic Add-ons:</div>
                        {item.addOns.map((addOn, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {addOn.name} (+{formatedCurrency(addOn.price)})
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Item Price */}
                    <div className="mt-3 pt-3 border-t text-right">
                      <span className="font-semibold">
                        {formatedCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
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
                  <span>{formatedCurrency(items.reduce((total, item) => total + item.basePrice, 0))}</span>
                </div>

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
                    Capacity: {selectedDropPoint.currentCapacity + items.length}/{selectedDropPoint.maxCapacity}
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
            onClick={customerForm.handleSubmit(onSubmit)}
            disabled={!selectedDropPoint || items.length === 0 || !isCapacityAvailable}
          >
            Proceed to QRIS Payment
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerStore } from "@/stores/customerStore";
import { useCustomerID } from "@/hooks/useNanoID";
import { PhoneInput } from "@/components/ui/phone-input";

export function DropPointOrderApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    whatsapp: "",
    alamat: "",
  });

  const prepareCustomer = useCustomerStore((state) => state.prepareCustomer);
  const customerId = useCustomerID();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationId) {
      toast.error("Location ID is required");
      return;
    }

    // Validate required fields
    if (!formData.username.trim() || !formData.whatsapp) {
      toast.error("Nama Customer dan WhatsApp wajib diisi");
      return;
    }

    // Basic phone validation
    if (formData.whatsapp.length < 10) {
        toast.error("Nomor WhatsApp tidak valid");
        return;
    }

    setIsLoading(true);

    try {
      const customerData = {
        customer_id: customerId,
        ...formData,
      };

      const success = await prepareCustomer(customerData);
      if (success) {
        // Store location ID for next step
        localStorage.setItem("drop_point_location_id", locationId);
        toast.success("Customer information saved successfully!");
        router.push(`/drop-point/${locationId}/new-order`);
      } else {
        toast.error("Failed to process customer information");
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Simple Progress Header */}
        <div className="mb-8 flex items-center justify-between text-sm font-medium text-gray-400">
            <div className="flex items-center text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 text-sm">1</div>
                Details
            </div>
            <div className="h-px bg-gray-200 flex-1 mx-4"></div>
            <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mr-2 text-sm">2</div>
                Items
            </div>
            <div className="h-px bg-gray-200 flex-1 mx-4"></div>
             <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mr-2 text-sm">3</div>
                Pay
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Who is this for?</h1>
                    <p className="text-gray-500 text-sm">
                        We need your details to track your order and notify you when it's ready.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                            <Input
                                placeholder="e.g. Ahmad Fulan"
                                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50/50 transition-all"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">WhatsApp Number</label>
                            <PhoneInput
                                placeholder="085-XXXX-XXXX"
                                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50/50 transition-all"
                                value={formData.whatsapp}
                                onChange={(value) => handleInputChange('whatsapp', value)}
                                defaultCountry="ID"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <Input
                                    placeholder="name@email.com"
                                    type="email"
                                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50/50 transition-all"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <Input
                                    placeholder="Short address"
                                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50/50 transition-all"
                                    value={formData.alamat}
                                    onChange={(e) => handleInputChange('alamat', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button 
                            type="submit" 
                            className="w-full h-14 text-lg rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Processing...
                                </span>
                            ) : (
                                "Continue to Add Items"
                            )}
                        </Button>
                        
                        <div className="text-center mt-4">
                             <button
                                type="button"
                                onClick={() => router.back()}
                                className="text-sm text-gray-400 hover:text-gray-600 font-medium"
                             >
                                Cancel & Go Back
                             </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
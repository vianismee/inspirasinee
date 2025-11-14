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

export default function DropPointOrderApp() {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationId) {
      toast.error("Location ID is required");
      return;
    }

    // Validate required fields
    if (!formData.username.trim() || !formData.whatsapp.trim()) {
      toast.error("Nama Customer dan WhatsApp wajib diisi");
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
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl mx-auto">
        <section className="w-full flex flex-col bg-zinc-200 h-full">
          <div className="flex-1 overflow-y-auto flex flex-col py-5 gap-4 px-6">
            {/* Header */}
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/drop-point")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Locations
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Drop-Point Customer Information</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Please enter your contact information. We'll check if you're an existing customer or create a new account for you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information Form */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nama Customer *</label>
                      <Input
                        placeholder="John Doe"
                        className="border border-zinc-400"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">WhatsApp *</label>
                      <Input
                        placeholder="085-XXXX-XXXX"
                        className="border-zinc-400"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        placeholder="example@mail.com"
                        type="email"
                        className="border-zinc-400"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">(Opsional)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Alamat</label>
                      <Input
                        placeholder="Jl. Contoh No. 123, Jakarta"
                        className="border-zinc-400"
                        value={formData.alamat}
                        onChange={(e) => handleInputChange('alamat', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">(Opsional)</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => router.push("/drop-point")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="px-8" disabled={isLoading}>
                      {isLoading ? "Processing..." : "Continue to Item Configuration"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Enter Contact Information</h4>
                      <p>We'll check if you're an existing customer using your WhatsApp number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Configure Your Items</h4>
                      <p>Add shoes, colors, sizes, and select cleaning services</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Payment & Confirmation</h4>
                      <p>Pay with QRIS and receive your drop-point confirmation</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
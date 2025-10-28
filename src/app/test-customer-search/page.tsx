"use client";

import { useState } from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SearchResult {
  phone: string;
  searchedPhone: string;
  successfulSearches: number;
  totalSearches: number;
  allCustomersSample?: unknown;
  searches: Array<{
    type: string;
    phoneUsed: string;
    found: boolean;
    phone: string;
    error?: string;
    data?: unknown;
    customer?: {
      customer_id: string;
      name?: string;
      phone?: string;
      whatsapp?: string;
    };
  }>;
}

export default function TestCustomerSearchPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  const testSearch = async () => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/debug/customers/search?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);

        // Show success message if customer found
        const successfulSearches = data.searches.filter((s: SearchResult['searches'][0]) => s.found);
        if (successfulSearches.length > 0) {
          toast.success(`Found customer via ${successfulSearches.map((s: SearchResult['searches'][0]) => s.type).join(', ')}`);
        } else {
          toast.error("No customer found with this phone number");
        }
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Customer Search Debug Tool</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Phone Number Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PhoneInput
                placeholder="Enter phone number to test"
                value={phone}
                onChange={setPhone}
                defaultCountry="ID"
                className="max-w-md"
              />
              <Button onClick={testSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search Customer"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Phone Searched:</strong> {result.searchedPhone}
                </div>
                <div>
                  <strong>Successful Searches:</strong> {result.successfulSearches}/{result.totalSearches}
                </div>

                <div>
                  <strong>Sample Customers (first 10):</strong>
                  <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                    {JSON.stringify(result.allCustomersSample, null, 2)}
                  </pre>
                </div>

                <div>
                  <strong>Search Methods:</strong>
                  <div className="mt-2 space-y-2">
                    {result.searches.map((search, index: number) => (
                      <div key={index} className={`p-3 rounded ${search.found ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex justify-between items-center">
                          <strong>{search.type}:</strong>
                          <span className={`px-2 py-1 rounded text-xs ${search.found ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {search.found ? 'FOUND' : 'NOT FOUND'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Searched for: {search.phone}
                        </div>
                        {search.error && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {search.error}
                          </div>
                        )}
                        {search.data != null && (
                          <pre className="mt-2 bg-white p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(search.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
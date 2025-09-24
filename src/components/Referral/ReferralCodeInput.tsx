"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useReferralStore } from "@/stores/referralStore";
import { CheckCircle, XCircle } from "lucide-react";

const formSchema = z.object({
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ReferralCodeInputProps {
  onReferralApplied?: (data: {
    referralCode: string;
    isValid: boolean;
    discountAmount?: number;
    referrerId?: string;
  }) => void;
  className?: string;
}

export function ReferralCodeInput({ onReferralApplied, className }: ReferralCodeInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    discountAmount?: number;
    referrerId?: string;
    referrerName?: string;
  } | null>(null);

  const { validateReferralCode } = useReferralStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referralCode: "",
    },
  });

  const { watch } = form;
  const referralCode = watch("referralCode");

  // Auto-validate when referral code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (referralCode && referralCode.trim()) {
        validateReferralCodeHandler();
      } else {
        setValidationResult(null);
        onReferralApplied?.({
          referralCode: "",
          isValid: false,
        });
      }
    }, 500); // Debounce validation

    return () => clearTimeout(timer);
  }, [referralCode]);

  const validateReferralCodeHandler = async () => {
    const code = form.getValues("referralCode");
    if (!code || !code.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateReferralCode(code.trim());
      setValidationResult(result);

      onReferralApplied?.({
        referralCode: code.trim(),
        isValid: result.isValid,
        discountAmount: result.discountAmount,
        referrerId: result.referrerId,
      });

      if (result.isValid) {
        toast.success(result.message);
      } else if (code.trim()) {
        toast.error(result.message);
      }
    } catch (error) {
      // Error validating referral code
      setValidationResult({
        isValid: false,
        message: "Error validating referral code",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Referral Code
          <Badge variant="secondary">Optional</Badge>
        </CardTitle>
        <CardDescription>
          Enter a referral code to get a discount on your first order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Code</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter referral code"
                        className={validationResult?.isValid
                          ? "border-green-500 focus:border-green-500"
                          : validationResult?.isValid === false
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        }
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={validateReferralCodeHandler}
                        disabled={isValidating || !referralCode?.trim()}
                        size="sm"
                      >
                        {isValidating ? "Validating..." : "Apply"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-3 rounded-lg border ${
                validationResult.isValid
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <div className="flex items-start gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {validationResult.isValid ? "Referral Code Applied!" : "Invalid Referral Code"}
                    </p>
                    <p className="text-sm mt-1">
                      {validationResult.message}
                    </p>
                    {validationResult.isValid && validationResult.referrerName && (
                      <p className="text-sm mt-1">
                        Referred by: {validationResult.referrerName}
                      </p>
                    )}
                    {validationResult.isValid && validationResult.discountAmount && (
                      <p className="text-sm font-medium mt-1">
                        Discount: Rp {validationResult.discountAmount.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
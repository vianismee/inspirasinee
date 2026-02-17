interface InfoCustomerProps {
  label: string;
  value?: string | null;
  valueClassName?: string;
}

export function InfoCustomer({ label, value, valueClassName }: InfoCustomerProps) {
  return (
    <div>
      <div className="flex justify-between items-start">
        <p className="text-muted-foreground">{label}</p>
        <p className={`font-bold text-right ${valueClassName || ""}`}>{value}</p>
      </div>
    </div>
  );
}

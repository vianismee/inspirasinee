interface InfoCustomerProps {
  label: string;
  value?: string | null;
}

export function InfoCustomer({ label, value }: InfoCustomerProps) {
  return (
    <div>
      <div className="flex justify-between items-start">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-right">{value}</p>
      </div>
    </div>
  );
}

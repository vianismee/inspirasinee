import { useState } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";

const SERVICE = [
  {
    name: "Express Cleaning (1 Day)",
    amount: 50000,
  },
  {
    name: "Deep Cleaning (3 Day)",
    amount: 35000,
  },
  {
    name: "Whitening Cleaning (4 Day)",
    amount: 45000,
  },
  {
    name: "Kids Shoe Treatment (3 Day)",
    amount: 30000,
  },
  {
    name: "Woman Shoe Treatment (3 Day)",
    amount: 30000,
  },
];

export function Services() {
  const [service, setService] = useState({
    shoeType: "",
    service: "",
    amount: 0,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
    </Card>
  );
}

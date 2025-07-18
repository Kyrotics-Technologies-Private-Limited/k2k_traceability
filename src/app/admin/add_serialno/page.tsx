"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddSerialNumber() {
  const [batchNumber, setBatchNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleAddSerialNumber = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Here you would typically call your Firebase function to add the serial number
      // For now, we'll just show a success message
      setMessage("Serial number added successfully!");
      setBatchNumber("");
      setSerialNumber("");
    } catch {
      setMessage("Error adding serial number. Please try again.");
    }
  };

  return (
    <section className="p-8">
      <h2 className="text-2xl font-bold mb-4">Add Serial Number</h2>
      <form onSubmit={handleAddSerialNumber} className="space-y-4">
        <div>
          <Label htmlFor="serialBatchNumber">Batch Number</Label>
          <Input
            id="serialBatchNumber"
            name="batchNumber"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
          />
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.includes("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
        <Button type="submit">Add Serial Number</Button>
      </form>
    </section>
  );
}

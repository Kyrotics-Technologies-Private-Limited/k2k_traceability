"use client";

import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AddSerialNumber({ onAddSerial }: { onAddSerial: (batchNumber: string, serialNumber: string) => void }) {
  const handleAddSerialNumber = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const batchNumber = form.batchNumber.value;
    const serialNumber = form.serialNumber.value;

    onAddSerial(batchNumber, serialNumber);
    form.reset();
  };

  return (
    <section className="p-8">
      <h2 className="text-2xl font-bold mb-4">Add Serial Number</h2>
      <form onSubmit={handleAddSerialNumber} className="space-y-4">
        <div>
          <Label htmlFor="serialBatchNumber">Batch Number</Label>
          <Input id="serialBatchNumber" name="batchNumber" required />
        </div>
        <div>
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input id="serialNumber" name="serialNumber" required />
        </div>
        <Button type="submit">Add Serial Number</Button>
      </form>
    </section>
  );
}

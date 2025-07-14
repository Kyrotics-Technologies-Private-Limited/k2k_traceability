import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen px-6 sm:px-16 py-20 bg-gradient-to-br from-green-200 via-white to-blue-100
 font-[var(--font-geist-sans)]"
    >
      <main className="max-w-6xl mx-auto flex flex-col items-center text-center gap-8">
        {/* Logo / Hero */}
        <Image
          src="/images/K2K Logo.png" // ✅ Use your actual logo file
          alt="Kishan2Kitchen Logo"
          width={120}
          height={120}
          className="rounded-full shadow-sm"
        />

        <h1 className="text-3xl sm:text-5xl font-bold text-green-700 leading-snug">
          Welcome to Kishan2Kitchen Traceability Portal
        </h1>
        <p className="text-gray-600 max-w-2xl text-base sm:text-lg">
          Track your produce, orders, and delivery status — from the farm to
          your kitchen. Empowering transparency in agricultural supply chains.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-6">
          <Link
            href="/customer"
            className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition"
          >
            Track Your Order
          </Link>
          <Link
            href="/admin"
            className="border border-green-600 text-green-700 px-6 py-3 rounded-full hover:bg-green-100 transition"
          >
            Admin Dashboard
          </Link>
          {/* <Link
            href="/farmer"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Farmer Login
          </Link> */}
        </div>

        {/* Stats / Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">
              Live Order Tracking
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Get real-time updates on your order status, from dispatch to
              doorstep.
            </p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">
              Farm to Table Transparency
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Know exactly where your food comes from — verified farmer details
              and timelines.
            </p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">
              Admin & Farmer Insights
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Centralized dashboards for managing products, logistics, and
              orders.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 text-sm text-gray-500 text-center">
        © 2025 Kishan2Kitchen. Empowering Agri Transparency.
      </footer>
    </div>
  );
}
